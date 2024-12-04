'use strict';

const soap = require('soap');
const fs = require('fs');
const https = require('https');

const wsdl = './TokenService.wsdl';

const url = process.env.TOKEN_SERVICE_URL;
const env = process.env.BANKWIZARD_ENV;

const publicCert = `./ssl/experian${env}/publicCert.pem`;
const privateKey = `./ssl/experian${env}/privateKeyDecrypted.pem`;
const ca = ['./ssl/ExperianIssueCA.cer', './ssl/ExperianCARootInter.cer'];

async function getToken() {
    const request = {
        application: 'CICA BankWizard Middleware Service',
        checkIP: true,
    };
    const security = new soap.ClientSSLSecurity(privateKey, publicCert, ca, {
        rejectUnauthorized: false,
    });
    const client = await soap.createClientAsync(
        wsdl,
        {
            wsdl_options: {
                httpsAgent: new https.Agent({
                    key: fs.readFileSync(privateKey, 'utf8'),
                    cert: fs.readFileSync(publicCert, 'utf8'),
                    ca,
                }),
            },
        },
        url,
    );

    client.setSecurity(security);

    const result = await client.LoginWithCertificateAsync(request);

    return btoa(result[0].LoginWithCertificateResult);
}

module.exports = Object.freeze({getToken});
