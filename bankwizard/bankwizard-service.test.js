'use strict';

const personalRequest = require('../testing/personalRequest');
const companyRequest = require('../testing/companyRequest');
const mockVerifyResponse = require('../testing/verifyResponse');

beforeEach(() => {
    jest.resetModules();
});

describe('BankWizard service tests', () => {
    jest.mock('../services/soap/bankwizard-client', () => ({
        submitRequest: jest.fn((req, res, cb, next, personal) => {
            const response = mockVerifyResponse(req, personal);
            cb(response, res, undefined, next);
        }),
        // eslint-disable-next-line no-unused-vars
        getBranchData: jest.fn((client, verifyResult, responseBody, cb, res, next) => {
            responseBody.branchName = 'Test branch';
            responseBody.bankName = 'Test bank';
            cb(responseBody, res, verifyResult, next);
        }),
    }));

    // eslint-disable-next-line global-require
    const bankWizardService = require('./bankwizard-service');

    it('should validate valid accounts', () => {
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
        const res = {
            status: (code) => ({
                json: (msg) => {
                    expect(code).toEqual(200);
                    expect(msg.companyScore).toEqual(1);
                },
            }),
        };
        bankWizardService.bankWizardCompanyRequest(companyRequest, res, (err) => {
            throw err;
        });
    });

    it('should include branch data', () => {
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
});
