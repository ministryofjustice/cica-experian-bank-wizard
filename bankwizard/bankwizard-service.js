'use strict';

const bankwizardClient = require('../services/soap/bankwizard-client');
const tokenClient = require('../services/soap/token-client');
const bankwizardErrors = require('../middleware/error-handler/bankwizard-errors');
const errorType = require('../middleware/error-handler/bankwizard-error-type');
const bankwizardErrorType = require('../middleware/error-handler/bankwizard-error-type');

// Check if any relevant error conditions returned with the result
function checkAccountConditions(verifyResult, responseBody) {
    if (verifyResult.conditions) {
        const {condition} = verifyResult.conditions;
        // Iterate over these conditions checking if they're in the local error or warning list
        for (let i = 0; i < condition.length; i += 1) {
            const {code, severity} = condition[i].attributes;
            let errorList = [];
            if (severity === 'error') {
                errorList = bankwizardErrors.ERROR;
            } else if (severity === 'warning') {
                errorList = bankwizardErrors.WARNING;
            }
            for (let j = 0; j < errorList.length; j += 1) {
                const error = errorList[j];
                if (error.codes.includes(Number(code))) {
                    // If the error code is listed, attach the error response and return false
                    responseBody.error = error.msg;
                    responseBody.errorType = error.type;
                    return false;
                }
            }
        }
    }
    // If the Experian status is unable to check, add an error
    if (
        verifyResult.accountInformation &&
        verifyResult.accountInformation.attributes &&
        verifyResult.accountInformation.attributes.accountVerificationStatus === 'Unable to check'
    ) {
        responseBody.error = 'Unable to verify - not in Experian database';
        responseBody.errorType = errorType.VERIFY_ERROR;
    }
    return true;
}

// Add the scores from the result to the response body
function appendScores(responseBody, verifyResult) {
    if (verifyResult.personalInformation) {
        // Add personal scores
        if (verifyResult.personalInformation.personalDetailsScore) {
            responseBody.personalScore = Number(
                verifyResult.personalInformation.personalDetailsScore,
            );
            if (Number.isNaN(responseBody.personalScore)) {
                return null;
            }
        } else {
            responseBody.personalScore = 0;
        }
        if (verifyResult.personalInformation.addressScore) {
            responseBody.addressScore = Number(verifyResult.personalInformation.addressScore);
            if (Number.isNaN(responseBody.addressScore)) {
                return null;
            }
        } else {
            responseBody.addressScore = 0;
        }
    } else if (verifyResult.companyInformation) {
        // Add company scores
        if (verifyResult.companyInformation.companyNameScore) {
            responseBody.companyNameScore = Number(
                verifyResult.companyInformation.companyNameScore,
            );
            if (Number.isNaN(responseBody.companyNameScore)) {
                return null;
            }
        } else {
            responseBody.companyNameScore = 0;
        }
        if (verifyResult.companyInformation.companyNameAndAddressScore) {
            responseBody.addressScore = Number(
                verifyResult.companyInformation.companyNameAndAddressScore,
            );
            if (Number.isNaN(responseBody.addressScore)) {
                return null;
            }
        } else {
            responseBody.addressScore = 0;
        }
    }

    return responseBody;
}

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

async function bankWizardRequest(req, personal) {
    // Fetch the encoded token from the TokenService
    const token = await tokenClient.getToken();

    // Build and submit a request to the BankWizard
    const result = await bankwizardClient.submitRequest(req, personal, token);

    // Start building the response
    const responseBody = {
        companyNameScore: 0,
        personalScore: 0,
        addressScore: 0,
        validate: false,
        errorType: bankwizardErrorType.NO_ERRORS,
        error: null,
        branchName: 'No data available',
        bankName: 'No data available',
    };

    const validateScore = checkAccountConditions(result, responseBody);

    responseBody.validate = validateScore;

    // If the account was a match in the data try and get the bank details
    if (validateScore) {
        let hasBankData = false;
        if (result.accountInformation.dataAccessKey) {
            // Wait 100ms to allow the previous connection to BankWizard to close
            await sleep(100);
            const branchData = await bankwizardClient.getBranchData(result, token);
            if (branchData) {
                // If able to get the bank details, replace the placeholder with these
                responseBody.branchName = branchData.branchName;
                responseBody.bankName = branchData.institutionName;
                hasBankData = true;
            }
        }
        // If unable to get the bank details, attach an error to the response
        if (!hasBankData) {
            responseBody.error = 'No branch or bank data could be retrieved for this account';
            responseBody.errorType = errorType.NO_BRANCH_DATA;
        }
    }

    // parse and add the scores from the original response
    const finalBody = appendScores(responseBody, result);

    // If all expected scores are present, return this, if not attach an error
    if (finalBody) {
        return {
            status: 200,
            body: finalBody,
        };
    }

    responseBody.error =
        'Response from Experian did not include expected results/scores.  This is likely due to an invalid request - please check the request data.';
    responseBody.errorType = errorType.PARSE_RESPONSE_ERROR;
    return {
        status: 400,
        body: responseBody,
    };
}

const bankwizardService = Object.freeze({
    bankWizardRequest,
});

module.exports = bankwizardService;
