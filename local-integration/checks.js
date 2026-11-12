/* eslint-disable no-console */

'use strict';

const assert = require('node:assert/strict');
const {spawn} = require('node:child_process');
const {setTimeout: delay} = require('node:timers/promises');
const pino = require('pino');

const personalRequest = require('../testing/personalRequest');
const companyRequest = require('../testing/companyRequest');

const logger = pino({level: 'info'});

const baseUrl = 'http://127.0.0.1:3100';
const env = {
    NODE_ENV: 'test',
    DCS_LOG_LEVEL: 'info',
    BANKWIZARD_ENV: 'stub',
    BANKWIZARD_URL: 'http://127.0.0.1:8000/wsdl',
    TOKEN_SERVICE_URL: 'http://127.0.0.1:8000/token',
    PORT: '3100',
};

async function waitFor(url, children) {
    let lastError;
    for (let attempt = 0; attempt < 50; attempt += 1) {
        if (children.some((child) => child.exitCode !== null || child.signalCode !== null)) {
            throw new Error(`A service exited while waiting for ${url}`);
        }
        try {
            // Readiness probes must run sequentially.
            // eslint-disable-next-line no-await-in-loop
            const response = await fetch(url, {signal: AbortSignal.timeout(1000)});
            // eslint-disable-next-line no-await-in-loop
            await response.text();
            if (response.ok) {
                return;
            }
            lastError = new Error(`HTTP ${response.status}`);
        } catch (err) {
            lastError = err;
        }
        // eslint-disable-next-line no-await-in-loop
        await delay(100);
    }
    throw new Error(`Service not ready at ${url}: ${lastError.message}`);
}

async function post(endpoint, body) {
    const response = await fetch(`${baseUrl}/api/v2/bankwizard/${endpoint}`, {
        method: 'POST',
        headers: {'content-type': 'application/json'},
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(5000),
    });
    const result = await response.json();
    return {status: response.status, body: result};
}

async function run() {
    const children = [
        spawn(process.execPath, ['stubs/bankwizard-stub.js'], {env, stdio: 'inherit'}),
        spawn(process.execPath, ['local-integration/start-app.js'], {env, stdio: 'inherit'}),
    ];
    const closed = children.map((child) => {
        child.on('error', (err) => {
            logger.error({err: err.message}, 'Unable to start service');
        });
        return new Promise((resolve) => {
            child.once('close', resolve);
        });
    });

    try {
        await waitFor(`${env.BANKWIZARD_URL}?wsdl`, children);
        await waitFor(`${env.TOKEN_SERVICE_URL}?wsdl`, children);
        await waitFor(`${baseUrl}/api/v2/bankwizard/status`, children);

        const status = await fetch(`${baseUrl}/api/v2/bankwizard/status`, {
            signal: AbortSignal.timeout(5000),
        });
        assert.equal(status.status, 200);
        assert.deepEqual(await status.json(), {status: 'Service up'});

        const expected = {
            companyNameScore: 0,
            personalScore: 0,
            addressScore: 2,
            validated: true,
            errorType: 'noErrors',
            error: null,
            branchName: 'Test branch',
            bankName: 'Test institution',
        };
        assert.deepEqual(await post('personal', personalRequest), {
            status: 200,
            body: expected,
        });
        assert.deepEqual(await post('company', companyRequest), {
            status: 200,
            body: {...expected, companyNameScore: 1},
        });

        const malformed = await post('personal', companyRequest);
        assert.equal(malformed.status, 400);
        assert.equal(malformed.body.validated, false);
        assert.equal(malformed.body.errorType, 'invalidRequestError');
    } finally {
        children.forEach((child) => child.kill('SIGTERM'));
        await Promise.all(closed);
    }

    console.log('Local integration passed: status, personal, company and invalid request.');
}

run().catch((err) => {
    logger.error({err: err.message}, 'Integration test failed');
    process.exitCode = 1;
});
