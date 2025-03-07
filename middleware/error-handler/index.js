'use strict';

const errorType = require('./bankwizard-error-type');

// Central error handler
// https://www.joyent.com/node-js/production/design/errors
// https://github.com/i0natan/nodebestpractices/blob/master/sections/errorhandling/centralizedhandling.md
// eslint-disable-next-line no-unused-vars
module.exports = async (err, req, res, next) => {
    const error = {
        companyNameScore: 0,
        personalScore: 0,
        addressScore: 0,
        validated: false,
        errorType: errorType.NO_ERRORS,
        error: null,
        branchName: null,
        bankName: null,
    };

    if (
        (err.code && (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT')) ||
        err.status === 401
    ) {
        error.error = 'Unable to connect to Experian';
        error.errorType = errorType.FATAL;
        return res.status(502).json(error);
    }

    if (err.message && err.message === 'Invalid address') {
        error.error =
            'The address provided is incomplete.  Please provide a valid address or remove the address from the request.';
        error.errorType = errorType.INVALID_REQUEST_ERROR;
        return res.status(400).json(error);
    }

    if (err.message && err.message === 'Unrecognised date') {
        error.error =
            'Could not set the date of birth for the personal details verification request - please check that it is in format dd-MM-yyyy';
        error.errorType = errorType.INVALID_REQUEST_ERROR;
        return res.status(400).json(error);
    }

    // handle a malformed JSON request e.g. can't be parsed by the bodyparser (express.json)
    // https://github.com/expressjs/body-parser/issues/122#issuecomment-328190379
    if ('type' in err && err.type === 'entity.parse.failed') {
        error.error = 'Request JSON is malformed';
        error.errorType = errorType.INVALID_REQUEST_ERROR;

        return res.status(400).json(error);
    }

    if (err.statusCode === 400 || err.status === 400) {
        error.error = '400 Bad Request';
        error.errorType = errorType.INVALID_REQUEST_ERROR;

        return res.status(400).json(error);
    }

    if (err.statusCode === 404 || err.status === 404) {
        error.error = '404 Not Found';
        error.errorType = errorType.INVALID_REQUEST_ERROR;

        return res.status(404).json(error);
    }

    // Unknown error
    error.error = '500 Internal Server Error';
    error.errorType = errorType.FATAL;
    return res.status(500).json(error);
};
