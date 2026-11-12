'use strict';

beforeEach(() => {
    jest.resetModules();
});

describe('Token Client', () => {
    jest.mock('soap');
    jest.mock('fs');

    process.env.BANKWIZARD_ENV = 'uat';

    // eslint-disable-next-line global-require
    const tokenClient = require('./token-client');

    // requires UAT ssl certificates to be present
    describe('getToken()', () => {
        it('should make a call using the soap library', async () => {
            const token = await tokenClient.getToken();
            expect(atob(token)).toEqual('SOAPToken');
        });

        describe('Local stub token client', () => {
            const originalEnv = {...process.env};

            beforeEach(() => {
                process.env.BANKWIZARD_ENV = 'stub';
                process.env.TOKEN_SERVICE_URL = 'http://127.0.0.1:8000/token';
                process.env.BANKWIZARD_URL = 'http://127.0.0.1:8000/wsdl';
                jest.clearAllMocks();
            });

            afterEach(() => {
                process.env = {...originalEnv};
            });

            it('uses the token SOAP client without reading certificates', async () => {
                // eslint-disable-next-line global-require
                const soap = require('soap');
                // eslint-disable-next-line global-require
                const fs = require('fs');
                // eslint-disable-next-line global-require
                const stubClient = require('./token-client');

                expect(atob(await stubClient.getToken())).toEqual('SOAPToken');
                expect(fs.readFileSync).not.toHaveBeenCalled();
                expect(soap.ClientSSLSecurity).not.toHaveBeenCalled();
            });

            it.each([
                ['TOKEN_SERVICE_URL', 'https://example.com/soap'],
                ['BANKWIZARD_URL', 'http://example.com/soap'],
                ['TOKEN_SERVICE_URL', 'https://127.0.0.1:8000/token'],
            ])('refuses unsafe stub endpoint %s=%s', async (variable, endpoint) => {
                process.env[variable] = endpoint;
                // eslint-disable-next-line global-require
                const stubClient = require('./token-client');
                await expect(stubClient.getToken()).rejects.toThrow(
                    'Stub mode requires local HTTP SOAP endpoints',
                );
            });
        });
    });
});
