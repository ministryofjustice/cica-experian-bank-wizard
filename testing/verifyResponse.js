'use strict';

function response(req, personal) {
    const res = {
        accountInformation: {
            sortCode: req.sortCode,
            accountNumber: req.accountNumber,
            rollNumber: req.rollNumber,
            dataAccessKey: 'test-accesskey',
            accountVerificationStatus: 'Match',
        },
        conditions: [],
    };
    if (personal) {
        res.personalInformation = {
            personalDetailsScore: 1,
            addressScore: 2,
            accountSetupDateMatch: 'Match',
            accountSetupDateScore: 3,
            accountTypeMatch: 'Match',
            accountOwnerMatch: 'Match',
        };
    } else {
        res.companyInformation = {
            companyNameScore: 1,
            companyNameAndAddressScore: 2,
            companyTypeMatch: 'Match',
            registrationNumberMatch: 'Match',
            proprietorDetailsScore: 3,
            companyAccountSetupDateScore: 4,
        };
    }
    return res;
}

module.exports = response;
