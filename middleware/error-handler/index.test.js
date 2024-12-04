/* eslint-disable global-require */

'use strict';

// Some of the testing for this file is handled in the routes testing.
// These tests just address the ones not able to be reached organically from there.

const errorType = require('./bankwizard-error-type');

describe('Error handler', () => {
    const errorHandler = require('./index');

    it('should return a status 502 when unable to connect to Experian', async () => {
        const res = {
            status: (code) => ({
                json: (msg) => {
                    expect(code).toEqual(502);
                    expect(msg.errorType).toEqual(errorType.FATAL);
                },
            }),
        };
        await errorHandler({code: 'ECONNREFUSED'}, {}, res, undefined);
    });

    it('should return a status 400 error for an invalid address', async () => {
        const res = {
            status: (code) => ({
                json: (msg) => {
                    expect(code).toEqual(400);
                    expect(msg.errorType).toEqual(errorType.INVALID_REQUEST_ERROR);
                },
            }),
        };
        await errorHandler({message: 'Invalid address'}, {}, res, undefined);
    });

    it('should return a status 400 error for an unrecognised date', async () => {
        const res = {
            status: (code) => ({
                json: (msg) => {
                    expect(code).toEqual(400);
                    expect(msg.errorType).toEqual(errorType.INVALID_REQUEST_ERROR);
                },
            }),
        };
        await errorHandler({message: 'Unrecognised date'}, {}, res, undefined);
    });

    it('should return a status 500 error for a bad request', async () => {
        const res = {
            status: (code) => ({
                json: (msg) => {
                    expect(code).toEqual(400);
                    expect(msg.errorType).toEqual(errorType.INVALID_REQUEST_ERROR);
                },
            }),
        };
        await errorHandler({status: 400}, {}, res, undefined);
    });

    it('should return a status 500 error for any unknown errors', async () => {
        const res = {
            status: (code) => ({
                json: (msg) => {
                    expect(code).toEqual(500);
                    expect(msg.errorType).toEqual(errorType.FATAL);
                },
            }),
        };
        await errorHandler({}, {}, res, undefined);
    });
});
