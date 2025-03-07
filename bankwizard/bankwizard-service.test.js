/* eslint-disable no-unused-vars */
/* eslint-disable global-require */

'use strict';

const bankwizardErrors = require('../middleware/error-handler/bankwizard-errors');
const bankwizardErrorType = require('../middleware/error-handler/bankwizard-error-type');
const errorType = require('../middleware/error-handler/bankwizard-error-type');
const personalRequest = require('../testing/personalRequest');
const companyRequest = require('../testing/companyRequest');
const mockVerifyResponse = require('../testing/verifyResponse');
const getBranchDataResponse = require('../testing/getBranchResponse');

const testToken = 'TestToken';

beforeEach(() => {
    jest.resetModules();
});

describe('BankWizard service tests', () => {
    const normalVerifyResponse = jest.fn((req, personal, token) =>
        mockVerifyResponse(req, personal),
    );

    const errorVerifyResponse = jest.fn((req, personal, token) =>
        mockVerifyResponse(req, personal, [{attributes: {severity: 'error', code: '1'}}]),
    );

    const warningVerifyResponse = jest.fn((req, personal, token) =>
        mockVerifyResponse(req, personal, [{attributes: {severity: 'warning', code: '7'}}]),
    );

    const notFoundVerifyResponse = jest.fn((req, personal, token) =>
        mockVerifyResponse(req, personal, [], false),
    );

    const incompleteVerifyResponse = jest.fn((req, personal, token) => {
        const res = mockVerifyResponse(req, personal);
        if (personal) {
            res.personalInformation.personalDetailsScore = 'aaa';
        } else {
            res.companyInformation.companyNameScore = 'aaaa';
        }
        return res;
    });

    const getBranchData = jest.fn((verifyResult, token) => getBranchDataResponse.branchData[0]);

    jest.mock('../services/soap/bankwizard-client', () => ({
        submitRequest: jest.fn(),
        getBranchData: jest.fn(),
    }));

    jest.mock('../services/soap/token-client', () => ({
        getToken: jest.fn(() => 'TestToken'),
    }));

    const bankWizardService = require('./bankwizard-service');
    const bankWizardClient = require('../services/soap/bankwizard-client');

    it('should validate valid accounts', async () => {
        bankWizardClient.submitRequest.mockImplementation(normalVerifyResponse);

        const response = await bankWizardService.bankWizardRequest(personalRequest, true);
        expect(response.status).toEqual(200);
        expect(response.body.validated).toEqual(true);
    });

    it('should extract scores for personal requests', async () => {
        bankWizardClient.submitRequest.mockImplementation(normalVerifyResponse);

        const response = await bankWizardService.bankWizardRequest(personalRequest, true);
        expect(response.status).toEqual(200);
        expect(response.body.personalScore).toEqual(1);
        expect(response.body.addressScore).toEqual(2);
        expect(response.body.companyNameScore).toEqual(0);
        expect(response.body.branchName).toEqual('No data available');
        expect(response.body.bankName).toEqual('No data available');
    });

    it('should extract scores for company requests', async () => {
        bankWizardClient.submitRequest.mockImplementation(normalVerifyResponse);

        const response = await bankWizardService.bankWizardRequest(companyRequest, false);
        expect(response.status).toEqual(200);
        expect(response.body.companyNameScore).toEqual(1);
        expect(response.body.addressScore).toEqual(2);
        expect(response.body.personalScore).toEqual(0);
        expect(response.body.branchName).toEqual('No data available');
        expect(response.body.bankName).toEqual('No data available');
    });

    it('should include valid branch data', async () => {
        bankWizardClient.submitRequest.mockImplementation(normalVerifyResponse);
        bankWizardClient.getBranchData.mockImplementation(getBranchData);

        const response = await bankWizardService.bankWizardRequest(personalRequest, true);
        expect(response.status).toEqual(200);
        expect(response.body.bankName).toEqual('Test institution');
        expect(response.body.branchName).toEqual('Test branch');
    });

    it("should include a null error when Experian doesn't give back an error condition", async () => {
        bankWizardClient.submitRequest.mockImplementation(normalVerifyResponse);

        const personalResponse = await bankWizardService.bankWizardRequest(personalRequest, true);
        expect(personalResponse.status).toEqual(200);
        expect(personalResponse.body.error).toBeNull();
        expect(personalResponse.body.errorType).toEqual(bankwizardErrorType.NO_ERRORS);

        const comapnyResponse = await bankWizardService.bankWizardRequest(personalRequest, true);
        expect(comapnyResponse.status).toEqual(200);
        expect(comapnyResponse.body.error).toBeNull();
        expect(comapnyResponse.body.errorType).toEqual(bankwizardErrorType.NO_ERRORS);
    });

    it('should include an error message and type when Experian gives back an error condition', async () => {
        bankWizardClient.submitRequest.mockImplementation(errorVerifyResponse);

        const response = await bankWizardService.bankWizardRequest(personalRequest, true);
        expect(response.status).toEqual(200);
        expect(response.body.error).toEqual(bankwizardErrors.ERROR[0].msg);
        expect(response.body.errorType).toEqual(bankwizardErrors.ERROR[0].type);
    });

    it('should include an error message and type when Experian gives back an warning condition', async () => {
        bankWizardClient.submitRequest.mockImplementation(warningVerifyResponse);

        const response = await bankWizardService.bankWizardRequest(companyRequest, false);
        expect(response.status).toEqual(200);
        expect(response.body.error).toEqual(bankwizardErrors.WARNING[1].msg);
        expect(response.body.errorType).toEqual(bankwizardErrors.WARNING[1].type);
    });

    it("should include an error message and type when the account isn't in the experian database", async () => {
        bankWizardClient.submitRequest.mockImplementation(notFoundVerifyResponse);

        const response = await bankWizardService.bankWizardRequest(personalRequest, true);
        expect(response.status).toEqual(200);
        expect(response.body.error).toEqual('Unable to verify - not in Experian database');
        expect(response.body.errorType).toEqual(errorType.VERIFY_ERROR);
    });

    it("should default scores to 0 when the account isn't found in the Experian database", async () => {
        bankWizardClient.submitRequest.mockImplementation(notFoundVerifyResponse);

        const personalRes = await bankWizardService.bankWizardRequest(personalRequest, true);

        expect(personalRes.status).toEqual(200);
        expect(personalRes.body.personalScore).toEqual(0);
        expect(personalRes.body.addressScore).toEqual(0);

        const companyRes = await bankWizardService.bankWizardRequest(companyRequest, false);
        expect(companyRes.status).toEqual(200);
        expect(companyRes.body.companyNameScore).toEqual(0);
        expect(companyRes.body.addressScore).toEqual(0);
    });

    it("should return an error message when the scores can't be parsed correctly", async () => {
        bankWizardClient.submitRequest.mockImplementation(incompleteVerifyResponse);

        const res = await bankWizardService.bankWizardRequest(personalRequest, true);

        expect(res.status).toEqual(400);
        expect(res.body.error).toEqual(
            'Response from Experian did not include expected results/scores.  This is likely due to an invalid request - please check the request data.',
        );
        expect(res.body.errorType).toEqual(errorType.PARSE_RESPONSE_ERROR);
    });
});
