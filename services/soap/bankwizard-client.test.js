'use strict';

const personalRequest = require('../../testing/personalRequest');
const companyRequest = require('../../testing/companyRequest');
const verifyResponse = require('../../testing/verifyResponse');

const bankwizardClient = require('./bankwizard-client');

const accountInformation = {
    sortCode: '01-01-01',
    accountNumber: '12345678',
    checkContext: 'Direct Credit',
    rollNumber: '1A',
};

const address = {
    deliveryPoint: [
        {
            deliveryType: 'houseNumber',
            value: '1',
        },
    ],
    postalPoint: [
        {
            postalType: 'street',
            value: 'Real Road',
        },
        {
            postalType: 'postcode',
            value: 'AA1 1AA',
        },
    ],
};

const personalInformation = {
    personal: {
        firstName: 'John',
        surname: 'Doe',
        dob: '2000-01-01',
    },
    address,
    ownerType: null,
};

const companyInformation = {
    companyName: 'Test Ltd.',
    address,
};

beforeEach(() => {
    jest.resetModules();
});

describe('BankWizard Client', () => {
    jest.mock('soap');

    describe('getBranchData()', () => {
        it('should carry over the access key', () => {
            const client = {
                BankWizard_v1_1_Service: {
                    BankWizard_v1_1_0_Port: {
                        // eslint-disable-next-line no-unused-vars
                        GetBranchData: (msg, cb) => {
                            expect(msg.dataAccessKey).toEqual('test-accesskey');
                        },
                    },
                },
            };

            bankwizardClient.getBranchData(
                client,
                verifyResponse(personalRequest, true),
                {},
                () => {},
                {},
                () => {},
            );
        });

        it('should format the bank data', () => {
            const client = {
                BankWizard_v1_1_Service: {
                    BankWizard_v1_1_0_Port: {
                        // eslint-disable-next-line no-unused-vars
                        GetBranchData: (msg, cb) => {
                            const res = {
                                branchData: [
                                    {
                                        institutionName: 'Test institution',
                                        branchName: 'Test branch',
                                        address: {
                                            addressLine: [],
                                            postOrZipCode: 'AA1 1AA',
                                        },
                                        telephoneNumber: '07123456789',
                                        faxNumber: '123-456-7890',
                                        closureDate: '2000-01-01',
                                    },
                                ],
                            };
                            cb(null, res);
                        },
                    },
                },
            };

            bankwizardClient.getBranchData(
                client,
                verifyResponse(personalRequest, true),
                {},
                // eslint-disable-next-line no-unused-vars
                (responseBody, res, verifyResult, next) => {
                    expect(responseBody.branchName).toEqual('Test branch');
                    expect(responseBody.bankName).toEqual('Test institution');
                },
                null,
                (err) => {
                    throw err;
                },
            );
        });
    });

    describe('submitRequest()', () => {
        it('should correctly format account information from a request', () => {
            const res = {
                status: (code) => ({
                    json: (msg) => {
                        expect(code).toEqual(200);
                        expect(msg.accountInformation).toEqual(accountInformation);
                    },
                }),
            };

            bankwizardClient.submitRequest(personalRequest, res, () => {}, true);
        });

        it('should correctly format personal information from a request', () => {
            const res = {
                status: (code) => ({
                    json: (msg) => {
                        expect(code).toEqual(200);
                        expect(msg.personalInformation).toEqual(personalInformation);
                    },
                }),
            };

            bankwizardClient.submitRequest(personalRequest, res, () => {}, true);
        });

        it('should correctly format company information from a request', () => {
            const res = {
                status: (code) => ({
                    json: (msg) => {
                        expect(code).toEqual(200);
                        expect(msg.companyInformation).toEqual(companyInformation);
                    },
                }),
            };

            bankwizardClient.submitRequest(companyRequest, res, () => {}, false);
        });

        it('should not include company information in a personal request', () => {
            const res = {
                status: (code) => ({
                    json: (msg) => {
                        expect(code).toEqual(200);
                        expect(msg.companyInformation).toBeUndefined();
                    },
                }),
            };

            bankwizardClient.submitRequest(companyRequest, res, () => {}, true);
        });

        it('should not include personal information in a company request', () => {
            const res = {
                status: (code) => ({
                    json: (msg) => {
                        expect(code).toEqual(200);
                        expect(msg.personalInformation).toBeUndefined();
                    },
                }),
            };

            bankwizardClient.submitRequest(personalRequest, res, () => {}, false);
        });
    });
});
