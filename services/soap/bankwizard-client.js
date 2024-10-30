'use strict';

const soap = require('soap');

const wsdl = './BankWizardService-v1.wsdl';

const url = process.env.BANKWIZARD_URL;

function buildPersonalDetails(req) {
    return {
        firstName: req.firstName,
        surname: req.lastName,
        dob: req.dOB,
    };
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

    postalPoint.push({
        postalType: 'postcode',
        value: req.postCode,
    });

    return {
        deliveryPoint,
        postalPoint,
    };
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

    if (personal) {
        msg.personalInformation = {
            personal: buildPersonalDetails(req),
            address: buildAddress(req),
            ownerType: null,
        };
    } else {
        msg.companyInformation = {
            companyName: req.companyName,
            address: buildAddress(req),
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
    client.BankWizard_v1_1_Service.BankWizard_v1_1_0_Port.GetBranchData(
        branchRequest,
        (error, result) => {
            if (error) {
                next(error);
            } else if (result.branchData.length > 0) {
                const branch = result.branchData[0];
                responseBody.branchName = branch.branchName;
                responseBody.bankName = branch.institutionName;
                cb(responseBody, res, verifyResult, next);
            } else {
                // TODO error handle no branch data
            }
        },
    );
}

function submitRequest(req, res, cb, next, personal) {
    soap.createClient(
        wsdl,
        (err, client) => {
            if (err) {
                next(err);
            } else {
                client.BankWizard_v1_1_Service.BankWizard_v1_1_0_Port.Verify(
                    buildVerifyRequest(req, personal),
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
