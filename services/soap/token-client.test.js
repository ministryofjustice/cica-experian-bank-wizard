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
    });
});
