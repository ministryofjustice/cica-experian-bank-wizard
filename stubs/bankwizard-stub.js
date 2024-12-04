/* eslint-disable no-console */
/* eslint-disable no-unused-vars */

'use strict';

const soap = require('soap');
const fs = require('fs');
const http = require('http');

const getBranchDataResponse = require('../testing/getBranchResponse');

const wsdl = fs.readFileSync('./BankWizardService-v1.wsdl', 'utf8');

const server = http.createServer((req, res) => {
    res.end(`404 Not Found: ${req.url}`);
});

server.listen(8000);

function GetBranchData(args, cb, headers, req) {
    return getBranchDataResponse;
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
        conditions: {
            condition: [
                {
                    attributes: {
                        severity: 'fake',
                        code: 999,
                    },
                },
            ],
        },
    };
    if (args.personalInformation) {
        // If the first name in the request is error or warning followed by a number
        // attach this error condition to the response
        if (
            args.personalInformation.personal.firstName.startsWith('error ') ||
            args.personalInformation.personal.firstName.startsWith('warning ')
        ) {
            res.conditions.condition.push({
                severity: args.personalInformation.firstname.split(' ')[0],
                code: args.personalInformation.firstname.split(' ')[1],
            });
        }
        res.personalInformation = {
            addressScore: 2,
            accountSetupDateMatch: 'Match',
            accountSetupDateScore: 3,
            accountTypeMatch: 'Match',
            accountOwnerMatch: 'Match',
        };
    } else {
        if (
            args.companyInformation.companyName.startsWith('error ') ||
            args.companyInformation.companyName.startsWith('warning ')
        ) {
            res.conditions.condition.push({
                severity: args.companyInformation.companyName.split(' ')[0],
                code: args.companyInformation.companyName.split(' ')[1],
            });
        }
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
        console.error(err.message);
    } else {
        console.log('Stub soap server started');
    }
});
