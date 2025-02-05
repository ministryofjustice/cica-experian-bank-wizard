'use strict';

const {GetObjectCommand, S3Client} = require('@aws-sdk/client-s3');
const {sdkStreamMixin} = require('@aws-sdk/util-stream-node');
const {mockClient} = require('aws-sdk-client-mock');
const {createReadStream} = require('fs');
const createS3Service = require('./index');

describe('S3 Service', () => {
    const s3Mock = mockClient(S3Client);

    it('Should get the item from the S3 bucket', async () => {
        // Arrange
        const stream = createReadStream('./testing/test.wsdl');
        const sdkStream = sdkStreamMixin(stream);
        s3Mock.on(GetObjectCommand).resolves({Body: sdkStream, ContentType: 'application/xml'});

        // Act
        const s3Service = createS3Service();
        const response = await s3Service.getFromS3('bucket', 'key');

        // Assert
        expect(response).toEqual(
            '<?xml version="1.0" encoding="UTF-8"?><definitions><test></definitions>',
        );
    });

    it('Should throw an error if the object/bucket is not found', async () => {
        // Arrange
        const mockCommand = {
            Bucket: 'wrong-bucket',
            Key: 'key',
        };
        s3Mock.on(GetObjectCommand, mockCommand).rejects('The specified bucket does not exist');

        // Act and Assert
        const s3Service = createS3Service();
        await expect(() => s3Service.getFromS3('wrong-bucket', 'key')).rejects.toThrow(
            'The specified bucket does not exist',
        );
    });
});
