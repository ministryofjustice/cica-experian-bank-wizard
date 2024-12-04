'use strict';

function response(req, personal, condition = [], found = true, returnKey = false) {
    const res = {
        accountInformation: {
            sortCode: req.sortCode,
            accountNumber: req.accountNumber,
            rollNumber: req.rollNumber,
            dataAccessKey: returnKey ? 'return-accesskey' : 'test-accesskey',
            attributes: {
                accountVerificationStatus: found ? 'Match' : 'Unable to check',
            },
        },
        conditions: {
            condition,
        },
    };
    if (personal) {
        res.personalInformation = {
            personalDetailsScore: found ? 1 : undefined,
            addressScore: found ? 2 : undefined,
            accountSetupDateMatch: found ? 'Match' : 'No Match',
            accountSetupDateScore: found ? 3 : undefined,
            accountTypeMatch: found ? 'Match' : 'No Match',
            accountOwnerMatch: found ? 'Match' : 'No Match',
        };
    } else {
        res.companyInformation = {
            companyNameScore: found ? 1 : undefined,
            companyNameAndAddressScore: found ? 2 : undefined,
            companyTypeMatch: found ? 'Match' : 'No Match',
            registrationNumberMatch: found ? 'Match' : 'No Match',
            proprietorDetailsScore: found ? 3 : undefined,
            companyAccountSetupDateScore: found ? 4 : undefined,
        };
    }
    return res;
}

module.exports = response;
