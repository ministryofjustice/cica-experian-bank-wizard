/* eslint-disable no-unused-vars */

'use strict';

const soap = require('soap');
const fs = require('fs');
const http = require('http');

const wsdl = fs.readFileSync('./BankWizardService-v1.wsdl', 'utf8');

const server = http.createServer((req, res) => {
    res.end(`404 Not Found: ${req.url}`);
});

server.listen(8000);

function GetBranchData(args, cb, headers, req) {
    return {
        branchData: [
            {
                institutionName: 'Test institution',
                branchName: 'Test branch',
                address: {
                    addressLine: [],
                    postOrZipCode: 'AA1 1AA',
                },
                telephoneNumber: '07123456789',
                faxNumber: '123-456-7890',
                closureDate: '2000-01-01',
            },
        ],
    };
}

function Verify(args, cb, headers, req) {
    const res = {
        accountInformation: {
            sortCode: args.accountInformation.sortCode,
            accountNumber: args.accountInformation.accountNumber,
            rollNumber: args.accountInformation.rollNumber,
            dataAccessKey: 'stub-accesskey',
            accountVerificationStatus: 'Match',
        },
        conditions: [],
    };
    if (args.personalInformation) {
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

const service = {
    BankWizard_v1_1_Service: {
        BankWizard_v1_1_0_Port: {
            GetBranchData,
            Verify,
        },
    },
};

soap.listen(server, '/wsdl', service, wsdl, (err, res) => {
    if (err) {
        console.log(err.message);
    } else {
        console.log('Stub soap server started');
    }
});
