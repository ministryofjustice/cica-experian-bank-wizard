'use strict';

const errorType = require('./bankwizard-error-type');

module.exports = Object.freeze({
    ERROR: [
        {
            codes: [1, 6],
            msg: 'Sort Code format is incorrect',
            type: errorType.VALIDATE_ERROR,
        },
        {
            codes: [2, 3, 4, 8, 9, 10],
            msg: 'Not a UK account',
            type: errorType.VALIDATE_ERROR,
        },
        {
            codes: [7],
            msg: 'Sort Code or Account Number is incorrect',
            type: errorType.VALIDATE_ERROR,
        },
        {
            codes: [11],
            msg: 'Sort Code is closed',
            type: errorType.VALIDATE_ERROR,
        },
        {
            codes: [12],
            msg: 'Branch has been transferred',
            type: errorType.VALIDATE_ERROR,
        },
        {
            codes: [13],
            msg: 'Bank has been closed',
            type: errorType.VALIDATE_ERROR,
        },
        {
            codes: [14],
            msg: 'Bank has been transferred',
            type: errorType.VALIDATE_ERROR,
        },
        {
            codes: [90],
            msg: 'Roll Number is incorrect',
            type: errorType.VALIDATE_ERROR,
        },
        {
            codes: [91],
            msg: 'Roll Number format is incorrect',
            type: errorType.VALIDATE_ERROR,
        },
        {
            codes: [92],
            msg: 'Roll Number has invalid characters',
            type: errorType.VALIDATE_ERROR,
        },
    ],
    WARNING: [
        {
            codes: [1],
            msg: 'Account details were not in a standard format',
            type: errorType.VALIDATE_ERROR,
        },
        {
            codes: [7],
            msg: 'Account Number unable to accept BACS',
            type: errorType.VALIDATE_ERROR,
        },
        {
            codes: [8],
            msg: 'Sort Code is unable to accept BACS',
            type: errorType.VALIDATE_ERROR,
        },
        {
            codes: [26, 64],
            msg: 'This is a foreign currency account',
            type: errorType.VALIDATE_ERROR,
        },
        {
            codes: [95],
            msg: 'Roll Number contains characters not allowed by BACS',
            type: errorType.VALIDATE_ERROR,
        },
        {
            codes: [106],
            msg: 'Sort Code and/or Account Number is incorrect',
            type: errorType.VALIDATE_ERROR,
        },
        {
            codes: [65],
            msg: 'Roll Number is missing',
            type: errorType.ROLL_NUM_REQUIRED,
        },
    ],
});
