'use strict';

/* eslint-disable no-unused-vars */

const getBranchDataResponse = require('../testing/getBranchResponse');

const soap = jest.createMockFromModule('soap');

function createClientAsync(wsdl, options, endpoint) {
    if (wsdl.includes('Token')) {
        return {
            LoginWithCertificateAsync: async (msg) => [
                {
                    LoginWithCertificateResult: 'SOAPToken',
                },
            ],
            setSecurity: (security) => {},
        };
    }
    if (wsdl.includes('BankWizard')) {
        return {
            VerifyAsync: async (msg) => [msg],
            GetBranchDataAsync: async (msg) => {
                if (msg['ns1:dataAccessKey'] === 'return-accesskey') {
                    return [msg];
                }
                return [getBranchDataResponse];
            },
            addSoapHeader: (header) => {},
        };
    }
    return null;
}

soap.createClientAsync = createClientAsync;

module.exports = soap;
