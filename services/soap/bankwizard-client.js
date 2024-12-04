'use strict';

const soap = require('soap');

const wsdl = './BankWizardService-v1.wsdl';

const url = process.env.BANKWIZARD_URL;

const wsseNamespace =
    'http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd';
const wsuNamespace =
    'http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd';

/* SOAP options to manually attach the correct namespaces to elements
for some reason it doesn't automatically attach all the ones Experian wants */
const soapOptions = {
    overrideRootElement: {
        namespace: 'v1_0',
        xmlnsAttributes: [
            {
                name: 'xmlns:ns1',
                value: 'http://experianpayments.com/bankwizard/xsd/2009/07',
            },
        ],
    },
};

// Builds the personal details section of the request
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

// Builds the address section of the request
function buildAddress(req) {
    const deliveryPoint = [];
    const postalPoint = [];

    if (req.houseNumber && !req.houseNumber !== '') {
        deliveryPoint.push({
            attributes: {deliveryType: 'houseNumber'},
            $value: req.houseNumber,
        });
    }

    if (req.street && !req.street !== '') {
        postalPoint.push({
            attributes: {postalType: 'street'},
            $value: req.street,
        });
    }

    if (req.postCode && req.postCode !== '') {
        postalPoint.push({
            attributes: {postalType: 'postcode'},
            $value: req.postCode,
        });
    }

    // Validates the address has the expected number of elements, or nothing
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

// Builds the account section of the request
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

// Builds a full Verify request, accepting a parameter for if it is a personal or company request
function buildVerifyRequest(req, personal) {
    const msg = {
        'ns1:accountInformation': buildAccount(req),
    };

    const address = buildAddress(req);

    if (personal) {
        msg['ns1:personalInformation'] = {
            personal: buildPersonalDetails(req),
            address,
            ownerType: null,
        };
    } else {
        msg['ns1:companyInformation'] = {
            companyName: req.companyName,
            address,
        };
    }
    return msg;
}

// Formats the token into a SOAP header that can be attached to the request
function buildTokenHeader(token) {
    return `
    <wsse:Security xmlns:wsse="${wsseNamespace}" xmlns:wsu="${wsuNamespace}">
        <wsse:BinarySecurityToken ValueType="ExperianWASP" EncodingType="wsse:Base64Binary" wsu:Id="SecurityToken">
            ${token}
        </wsse:BinarySecurityToken>
    </wsse:Security>`;
}

// Makes a call to the Experian Bank Wizard to get branch data
async function getBranchData(verifyResult, token) {
    const securityHeader = buildTokenHeader(token);
    // Build request
    const branchRequest = {
        'ns1:dataAccessKey': verifyResult.accountInformation.dataAccessKey,
        'ns1:returnSubBranches': false,
        'ns1:language': 'en',
    };

    const client = await soap.createClientAsync(wsdl, soapOptions, url);

    client.addSoapHeader(securityHeader);
    const result = await client.GetBranchDataAsync(branchRequest);

    // Extracts the branch data or returns null if this can't be found
    if (result[0].branchData && result[0].branchData.length > 0) {
        return result[0].branchData[0];
    }
    return null;
}

// Makes a call to the Experian Bank Wizard to verify bank information
async function submitRequest(req, personal, token) {
    const securityHeader = buildTokenHeader(token);

    let request = {};
    request = buildVerifyRequest(req, personal);

    const client = await soap.createClientAsync(wsdl, soapOptions, url);
    client.addSoapHeader(securityHeader);

    const result = await client.VerifyAsync(request);
    return result[0];
}

const bankwizardClient = Object.freeze({submitRequest, getBranchData});

module.exports = bankwizardClient;
