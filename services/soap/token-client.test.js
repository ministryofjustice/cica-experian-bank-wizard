'use strict';

const {GetObjectCommand, S3Client} = require('@aws-sdk/client-s3');
const {sdkStreamMixin} = require('@aws-sdk/util-stream-node');
const {mockClient} = require('aws-sdk-client-mock');
const {createReadStream} = require('fs');

beforeEach(() => {
    jest.resetModules();
});

describe('Token Client', () => {
    jest.mock('soap');
    const s3Mock = mockClient(S3Client);
    process.env.S3_BUCKET = 'bucket';

    // eslint-disable-next-line global-require
    const tokenClient = require('./token-client');

    // requires UAT ssl certificates to be present
    describe('getToken()', () => {
        it.skip('should make a call using the soap library', async () => {
            // Arrange
            const stream = createReadStream('./testing/test.wsdl');
            const sdkStream = sdkStreamMixin(stream);
            s3Mock.on(GetObjectCommand).resolves({Body: sdkStream, ContentType: 'application/xml'});

            const token = await tokenClient.getToken();
            expect(atob(token)).toEqual('SOAPToken');
        });
    });
});
