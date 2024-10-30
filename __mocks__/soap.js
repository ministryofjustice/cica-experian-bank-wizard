'use strict';

const soap = jest.createMockFromModule('soap');

// eslint-disable-next-line no-unused-vars
function createClient(url, callback, endpoint) {
    callback(null, {
        BankWizard_v1_1_Service: {
            BankWizard_v1_1_0_Port: {
                Verify: (msg, cb) => {
                    cb(null, msg);
                },
            },
        },
    });
}

soap.createClient = createClient;

module.exports = soap;
