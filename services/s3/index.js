'use strict';

const {GetObjectCommand, S3Client} = require('@aws-sdk/client-s3');
const logger = require('../logging/logger');

/** Returns S3 Service object with functions to get objects from an S3 bucket and put objects in an S3 bucket */

function createS3Service() {
    /* istanbul ignore next */

    const s3client = new S3Client({
        region: 'eu-west-2',
        endpoint: process.env.NODE_ENV === 'local' ? 'http://localhost:4566' : undefined,
        forcePathStyle: process.env.NODE_ENV === 'local' ? true : undefined,
    });

    /**
     * Gets a JSON object with a key that matches the given key from a given S3 bucket
     * @param {string} bucket - The bucket to get the object from
     * @param {string} key - The key to match with a json in the bucket
     * @returns object from bucket with key matching given key
     */
    async function getFromS3(bucket, key) {
        const content = {
            Bucket: bucket,
            Key: `${key}`,
        };

        try {
            const response = await s3client.send(new GetObjectCommand(content));
            return response.Body.transformToString();
        } catch (err) {
            logger.error(err);
            throw err;
        }
    }

    return Object.freeze({
        getFromS3,
    });
}

module.exports = createS3Service;
