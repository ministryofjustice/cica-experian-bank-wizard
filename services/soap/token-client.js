'use strict';

const soap = require('soap');
const https = require('https');
const createS3Service = require('../s3');

const url = process.env.TOKEN_SERVICE_URL;
const bucket = process.env.S3_BUCKET;

async function getToken() {
    const s3Service = createS3Service();

    const wsdl = await s3Service.getFromS3(bucket, 'wsdl/tokenservice.wsdl');
    const publicCert = await s3Service.getFromS3(bucket, 'ssl/public.pem');
    const privateKey = await s3Service.getFromS3(bucket, 'ssl/private.pem');
    const ca = await s3Service.getFromS3(bucket, 'ssl/ca.cer');

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
                    key: privateKey,
                    cert: publicCert,
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
