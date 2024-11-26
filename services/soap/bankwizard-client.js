'use strict';

const soap = require('soap');

const errorType = require('../../middleware/error-handler/bankwizard-error-type');

const wsdl = './BankWizardService-v1.wsdl';

const url = process.env.BANKWIZARD_URL;

function buildPersonalDetails(req) {
    // RegEx for date in format dd-mm-yyyy
    const reg = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0,1,2])-\d{4}$/;
    if (reg.test(req.dOB)) {
        const dateParts = req.dOB.split('-');
        return {
            firstName: req.firstName,
            surname: req.lastName,
            // Convert the date to yyyy-mm-dd for passing to Experian
            dob: `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`,
        };
    }
    throw new Error('Unrecognised date');
}

function buildAddress(req) {
    const deliveryPoint = [];
    const postalPoint = [];

    if (req.houseNumber && !req.houseNumber !== '') {
        deliveryPoint.push({
            deliveryType: 'houseNumber',
            value: req.houseNumber,
        });
    }

    if (req.street && !req.street !== '') {
        postalPoint.push({
            postalType: 'street',
            value: req.street,
        });
    }

    if (req.postCode && req.postCode !== '') {
        postalPoint.push({
            postalType: 'postcode',
            value: req.postCode,
        });
    }

    if (deliveryPoint.length + postalPoint.length > 0) {
        if (deliveryPoint.length === 0 || postalPoint.length === 0) {
            throw new Error('Invalid address');
        }
        return {
            deliveryPoint,
            postalPoint,
        };
    }
    return null;
}

function buildAccount(req) {
    const account = {
        sortCode: req.sortCode,
        accountNumber: req.accountNumber,
        checkContext: 'Direct Credit',
    };
    if (req.rollNumber && req.rollNumber !== '') {
        account.rollNumber = req.rollNumber;
    }
    return account;
}

function buildVerifyRequest(req, personal) {
    const msg = {
        accountInformation: buildAccount(req),
    };

    const address = buildAddress(req);

    if (personal) {
        msg.personalInformation = {
            personal: buildPersonalDetails(req),
            address,
            ownerType: null,
        };
    } else {
        msg.companyInformation = {
            companyName: req.companyName,
            address,
        };
    }
    return msg;
}

function getBranchData(client, verifyResult, responseBody, cb, res, next) {
    const branchRequest = {
        dataAccessKey: verifyResult.accountInformation.dataAccessKey,
        returnSubBranches: false,
        language: 'en',
    };
    responseBody.branchName = 'No data available';
    responseBody.bankName = 'No data available';
    client.BankWizard_v1_1_Service.BankWizard_v1_1_0_Port.GetBranchData(
        branchRequest,
        (error, result) => {
            if (error) {
                next(error);
            } else if (result.branchData.length > 0) {
                const branch = result.branchData[0];
                responseBody.branchName = branch.branchName;
                responseBody.bankName = branch.institutionName;
            } else {
                responseBody.error = 'No branch or bank data could be retrieved for this account';
                responseBody.errorType = errorType.NO_BRANCH_DATA;
            }
            cb(responseBody, res, verifyResult, next);
        },
    );
}

function submitRequest(req, res, cb, next, personal) {
    let request = {};
    try {
        request = buildVerifyRequest(req, personal);
    } catch (err) {
        next(err);
        return;
    }
    soap.createClient(
        wsdl,
        (err, client) => {
            if (err) {
                next(err);
            } else {
                client.BankWizard_v1_1_Service.BankWizard_v1_1_0_Port.Verify(
                    request,
                    (error, result) => {
                        if (error) {
                            next(error);
                        } else {
                            cb(result, res, client, next);
                        }
                    },
                );
            }
        },
        url,
    );
}

module.exports = Object.freeze({submitRequest, getBranchData});
