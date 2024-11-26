/* eslint-disable no-unused-vars */

'use strict';

const personalRequest = require('../../testing/personalRequest');
const companyRequest = require('../../testing/companyRequest');
const verifyResponse = require('../../testing/verifyResponse');
const errorType = require('../../middleware/error-handler/bankwizard-error-type');

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
        dob: '2000-01-31',
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

        it('should set the correct response when there is no branch data', () => {
            const client = {
                BankWizard_v1_1_Service: {
                    BankWizard_v1_1_0_Port: {
                        GetBranchData: (msg, cb) => {
                            const res = {
                                branchData: [],
                            };
                            cb(null, res);
                        },
                    },
                },
            };
            bankwizardClient.getBranchData(
                client,
                verifyResponse(companyRequest, false),
                {},
                (responseBody, res, verifyResult, next) => {
                    expect(responseBody.branchName).toEqual('No data available');
                    expect(responseBody.bankName).toEqual('No data available');
                    expect(responseBody.error).toEqual(
                        'No branch or bank data could be retrieved for this account',
                    );
                    expect(responseBody.errorType).toEqual(errorType.NO_BRANCH_DATA);
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
            const cb = (msg, res, client, next) => {
                expect(msg.accountInformation).toEqual(accountInformation);
            };

            bankwizardClient.submitRequest(
                personalRequest,
                {},
                cb,
                (err) => {
                    throw err;
                },
                true,
            );
        });

        it('should correctly format personal information from a request', () => {
            const cb = (msg, res, client, next) => {
                expect(msg.personalInformation).toEqual(personalInformation);
            };

            bankwizardClient.submitRequest(
                personalRequest,
                {},
                cb,
                (err) => {
                    throw err;
                },
                true,
            );
        });

        it('should correctly format company information from a request', () => {
            const cb = (msg, res, client, next) => {
                expect(msg.companyInformation).toEqual(companyInformation);
            };

            bankwizardClient.submitRequest(
                companyRequest,
                {},
                cb,
                (err) => {
                    throw err;
                },
                false,
            );
        });

        it('should not include company information in a personal request', () => {
            const req = personalRequest;
            req.companyName = companyRequest.companyName;

            const cb = (msg, res, client, next) => {
                expect(msg.companyInformation).toBeUndefined();
            };

            bankwizardClient.submitRequest(
                req,
                {},
                cb,
                (err) => {
                    throw err;
                },
                true,
            );
        });

        it('should not include personal information in a company request', () => {
            const req = personalRequest;
            req.companyName = companyRequest.companyName;

            const cb = (msg, res, client, next) => {
                expect(msg.personalInformation).toBeUndefined();
            };

            bankwizardClient.submitRequest(
                req,
                {},
                cb,
                (err) => {
                    throw err;
                },
                false,
            );
        });
    });

    it('should throw an error if only one part of the address is present', () => {
        const req = personalRequest;
        delete req.houseNumber;
        bankwizardClient.submitRequest(
            req,
            {},
            () => {},
            (err) => {
                expect(err.message).toEqual('Invalid address');
            },
            true,
        );
    });

    it('should not include the address if no parts are present', () => {
        const req = personalRequest;
        delete req.houseNumber;
        delete req.street;
        delete req.postCode;
        const cb = (msg, res, client, next) => {
            expect(msg.personalInformation.address).toEqual(null);
        };
        bankwizardClient.submitRequest(
            req,
            {},
            cb,
            (err) => {
                throw err;
            },
            true,
        );
    });

    it('should throw an error if the date of birth is incorrectly formatted', () => {
        const req = personalRequest;
        req.dOB = '01-31-2002';
        bankwizardClient.submitRequest(
            req,
            {},
            () => {},
            (err) => {
                expect(err.message).toEqual('Unrecognised date');
            },
            true,
        );
    });
});
