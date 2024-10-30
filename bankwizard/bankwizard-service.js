'use strict';

const bankwizardClient = require('../services/soap/bankwizard-client');

function checkAccountConditions(verifyResult) {
    const {conditions} = verifyResult;
    const {accountVerificationStatus} = verifyResult.accountInformation;

    if (conditions) {
        if (conditions.length < 1) {
            if (accountVerificationStatus === '') {
                // TODO error handling
            }
            return true;
        }

        conditions.array.forEach((condition) => {
            // eslint-disable-next-line no-unused-vars
            const {code, severity} = condition;
            if (severity === 'error') {
                // TODO error condition handling
            } else if (severity === 'warning') {
                // TODO warning condition handling
            }
        });
    }
    return true;
}

// eslint-disable-next-line no-unused-vars
function getScores(responseBody, res, verifyResult, next) {
    if (verifyResult.personalInformation) {
        if (verifyResult.personalInformation.personalDetailsScore) {
            responseBody.personalScore = Number(
                verifyResult.personalInformation.personalDetailsScore,
            );
        }
        if (verifyResult.personalInformation.addressScore) {
            responseBody.addressScore = Number(verifyResult.personalInformation.addressScore);
        }
    } else if (verifyResult.companyInformation) {
        if (verifyResult.companyInformation.companyNameScore) {
            responseBody.companyScore = Number(verifyResult.companyInformation.companyNameScore);
        }
        if (verifyResult.companyInformation.addressScore) {
            responseBody.addressScore = Number(verifyResult.companyInformation.addressScore);
        }
    }

    res.status(200).json(responseBody);
}

function verifyRequestCallback(result, res, client, next) {
    const validateScore = checkAccountConditions(result);
    const responseBody = {
        validateScore,
    };
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
