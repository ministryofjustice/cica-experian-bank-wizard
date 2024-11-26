'use strict';

const bankwizardClient = require('../services/soap/bankwizard-client');
const bankwizardErrors = require('../middleware/error-handler/bankwizard-errors');
const errorType = require('../middleware/error-handler/bankwizard-error-type');

function checkAccountConditions(verifyResult, responseBody) {
    const {conditions} = verifyResult;

    if (conditions) {
        for (let i = 0; i < conditions.length; i += 1) {
            const {severity, code} = conditions[i];
            let errorList = [];
            if (severity === 'error') {
                errorList = bankwizardErrors.ERROR;
            } else if (severity === 'warning') {
                errorList = bankwizardErrors.WARNING;
            }
            for (let j = 0; j < errorList.length; j += 1) {
                const error = errorList[j];
                if (error.codes.includes(Number(code))) {
                    responseBody.error = error.msg;
                    responseBody.errorType = error.type;
                    return false;
                }
            }
        }
    }
    if (verifyResult.accountInformation.accountVerificationStatus === 'Unable to check') {
        responseBody.error = 'Unable to verify - not in Experian database';
        responseBody.errorType = errorType.VERIFY_ERROR;
    }
    return true;
}

// eslint-disable-next-line no-unused-vars
function getScores(responseBody, res, verifyResult, next) {
    try {
        if (verifyResult.personalInformation) {
            if (verifyResult.personalInformation.personalDetailsScore) {
                responseBody.personalScore = Number(
                    verifyResult.personalInformation.personalDetailsScore,
                );
            } else {
                responseBody.personalScore = 0;
            }
            if (verifyResult.personalInformation.addressScore) {
                responseBody.addressScore = Number(verifyResult.personalInformation.addressScore);
            } else {
                responseBody.addressScore = 0;
            }
        } else if (verifyResult.companyInformation) {
            if (verifyResult.companyInformation.companyNameScore) {
                responseBody.companyScore = Number(
                    verifyResult.companyInformation.companyNameScore,
                );
            } else {
                responseBody.companyScore = 0;
            }
            if (verifyResult.companyInformation.companyNameAndAddressScore) {
                responseBody.addressScore = Number(
                    verifyResult.companyInformation.companyNameAndAddressScore,
                );
            } else {
                responseBody.addressScore = 0;
            }
        }
    } catch {
        responseBody.error =
            'Response from Experian did not include expected results/scores.  This is likely due to an invalid request - please check the request data.';
        responseBody.errorType = errorType.PARSE_RESPONSE_ERROR;
        res.status(400).json(responseBody);
        return;
    }

    res.status(200).json(responseBody);
}

function verifyRequestCallback(result, res, client, next) {
    const responseBody = {};

    const validateScore = checkAccountConditions(result, responseBody);

    responseBody.validateScore = validateScore;

    if (validateScore) {
        bankwizardClient.getBranchData(client, result, responseBody, getScores, res, next);
    } else {
        getScores(responseBody, res, result, next);
    }
}

function bankWizardPersonalRequest(req, res, next) {
    bankwizardClient.submitRequest(req, res, verifyRequestCallback, next, true);
}

function bankWizardCompanyRequest(req, res, next) {
    bankwizardClient.submitRequest(req, res, verifyRequestCallback, next, false);
}

module.exports = Object.freeze({
    bankWizardPersonalRequest,
    bankWizardCompanyRequest,
});
