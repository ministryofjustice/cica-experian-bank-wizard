/* eslint-disable global-require */

'use strict';

const bankwizardErrors = require('../middleware/error-handler/bankwizard-errors');
const errorType = require('../middleware/error-handler/bankwizard-error-type');
const personalRequest = require('../testing/personalRequest');
const companyRequest = require('../testing/companyRequest');
const mockVerifyResponse = require('../testing/verifyResponse');

beforeEach(() => {
    jest.resetModules();
});

describe('BankWizard service tests', () => {
    const normalVerifyResponse = jest.fn((req, res, cb, next, personal) => {
        const response = mockVerifyResponse(req, personal);
        cb(response, res, undefined, next);
    });

    const errorVerifyResponse = jest.fn((req, res, cb, next, personal) => {
        const response = mockVerifyResponse(req, personal, [{severity: 'error', code: '1'}]);
        cb(response, res, undefined, next);
    });

    const warningVerifyResponse = jest.fn((req, res, cb, next, personal) => {
        const response = mockVerifyResponse(req, personal, [{severity: 'warning', code: '7'}]);
        cb(response, res, undefined, next);
    });

    const notFoundVerifyResponse = jest.fn((req, res, cb, next, personal) => {
        const response = mockVerifyResponse(req, personal, [], false);
        cb(response, res, undefined, next);
    });

    jest.mock('../services/soap/bankwizard-client', () => ({
        submitRequest: jest.fn(),
        // eslint-disable-next-line no-unused-vars
        getBranchData: jest.fn((client, verifyResult, responseBody, cb, res, next) => {
            responseBody.branchName = 'Test branch';
            responseBody.bankName = 'Test bank';
            cb(responseBody, res, verifyResult, next);
        }),
    }));

    const bankWizardService = require('./bankwizard-service');
    const bankWizardClient = require('../services/soap/bankwizard-client');

    it('should validate valid accounts', () => {
        bankWizardClient.submitRequest.mockImplementation(normalVerifyResponse);
        const res = {
            status: (code) => ({
                json: (msg) => {
                    expect(code).toEqual(200);
                    expect(msg.validateScore).toEqual(true);
                },
            }),
        };
        bankWizardService.bankWizardPersonalRequest(personalRequest, res, (err) => {
            throw err;
        });
    });

    it('should extract scores for personal requests', () => {
        bankWizardClient.submitRequest.mockImplementation(normalVerifyResponse);
        const res = {
            status: (code) => ({
                json: (msg) => {
                    expect(code).toEqual(200);
                    expect(msg.personalScore).toEqual(1);
                    expect(msg.addressScore).toEqual(2);
                },
            }),
        };
        bankWizardService.bankWizardPersonalRequest(personalRequest, res, (err) => {
            throw err;
        });
    });

    it('should extract scores for company requests', () => {
        bankWizardClient.submitRequest.mockImplementation(normalVerifyResponse);
        const res = {
            status: (code) => ({
                json: (msg) => {
                    expect(code).toEqual(200);
                    expect(msg.companyScore).toEqual(1);
                    expect(msg.addressScore).toEqual(2);
                },
            }),
        };
        bankWizardService.bankWizardCompanyRequest(companyRequest, res, (err) => {
            throw err;
        });
    });

    it('should include branch data', () => {
        bankWizardClient.submitRequest.mockImplementation(normalVerifyResponse);
        const res = {
            status: (code) => ({
                json: (msg) => {
                    expect(code).toEqual(200);
                    expect(msg.bankName).toEqual('Test bank');
                    expect(msg.branchName).toEqual('Test branch');
                },
            }),
        };
        bankWizardService.bankWizardPersonalRequest(personalRequest, res, (err) => {
            throw err;
        });
    });

    it('should include an error message and type when Experian gives back an error condition', () => {
        bankWizardClient.submitRequest.mockImplementation(errorVerifyResponse);
        const res = {
            status: (code) => ({
                json: (msg) => {
                    expect(code).toEqual(200);
                    expect(msg.error).toEqual(bankwizardErrors.ERROR[0].msg);
                    expect(msg.errorType).toEqual(bankwizardErrors.ERROR[0].type);
                },
            }),
        };
        bankWizardService.bankWizardPersonalRequest(personalRequest, res, (err) => {
            throw err;
        });
    });

    it('should include an error message and type when Experian gives back an warning condition', () => {
        bankWizardClient.submitRequest.mockImplementation(warningVerifyResponse);
        const res = {
            status: (code) => ({
                json: (msg) => {
                    expect(code).toEqual(200);
                    expect(msg.error).toEqual(bankwizardErrors.WARNING[1].msg);
                    expect(msg.errorType).toEqual(bankwizardErrors.WARNING[1].type);
                },
            }),
        };
        bankWizardService.bankWizardCompanyRequest(companyRequest, res, (err) => {
            throw err;
        });
    });

    it("should include an error message and type when the account isn't in the experian database", () => {
        bankWizardClient.submitRequest.mockImplementation(notFoundVerifyResponse);
        const res = {
            status: (code) => ({
                json: (msg) => {
                    expect(code).toEqual(200);
                    expect(msg.error).toEqual('Unable to verify - not in Experian database');
                    expect(msg.errorType).toEqual(errorType.VERIFY_ERROR);
                },
            }),
        };
        bankWizardService.bankWizardPersonalRequest(personalRequest, res, (err) => {
            throw err;
        });
    });

    it("should default scores to 0 when the account isn't found in the Experian database", () => {
        bankWizardClient.submitRequest.mockImplementation(notFoundVerifyResponse);
        const personalRes = {
            status: (code) => ({
                json: (msg) => {
                    expect(code).toEqual(200);
                    expect(msg.personalScore).toEqual(0);
                    expect(msg.addressScore).toEqual(0);
                },
            }),
        };
        bankWizardService.bankWizardPersonalRequest(personalRequest, personalRes, (err) => {
            throw err;
        });

        const companyRes = {
            status: (code) => ({
                json: (msg) => {
                    expect(code).toEqual(200);
                    expect(msg.companyScore).toEqual(0);
                    expect(msg.addressScore).toEqual(0);
                },
            }),
        };
        bankWizardService.bankWizardCompanyRequest(companyRequest, companyRes, (err) => {
            throw err;
        });
    });
});
