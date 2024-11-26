'use strict';

require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const path = require('path');
const pino = require('pino-http');
const OpenApiValidator = require('express-openapi-validator');
const errorHandler = require('./middleware/error-handler');
const docsRouter = require('./docs/routes');
const bankWizardRouter = require('./bankwizard/routes');

if (!process.env.DCS_LOG_LEVEL) {
    process.env.DCS_LOG_LEVEL = 'info';
}

const app = express();
const logger = pino({
    level: process.env.DCS_LOG_LEVEL,
    print:
        process.env.NODE_ENV === 'production'
            ? false
            : {
                  levelFirst: true,
                  colorize: true,
                  translateTime: true,
                  // errorProps: 'req,res'
              },
    customLogLevel: (req, res, err) => {
        if (res.statusCode >= 400 && res.statusCode < 500) {
            return 'warn';
        }

        if (res.statusCode >= 500 || err) {
            return 'error';
        }

        return 'info';
    },
    serializers: {
        req: (req) => ({
            id: req.id,
            method: req.method,
            url: req.url,
            remoteAddress: req.remoteAddress,
            remotePort: req.remotePort,
        }),
        res: (res) => ({
            statusCode: res.statusCode,
        }),
    },
    transport: {
        target: 'pino-pretty',
    },
});

app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", 'data:'],
                objectSrc: ["'none'"],
            },
        },
        hsts: {
            maxAge: 60 * 60 * 24 * 365, // the units is seconds.
        },
    }),
);

// logging
app.use(logger);
// https://expressjs.com/en/api.html#express.json
app.use(express.json({type: 'application/json'}));
// https://expressjs.com/en/api.html#express.urlencoded
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());

app.use(express.static(path.join(__dirname, 'public')));

app.use('/docs', docsRouter);

app.use(
    '/v2/bankwizard',
    OpenApiValidator.middleware({
        apiSpec: './openapi/openapi.json',
        validateRequests: true,
        validateResponses: false,
        validateSecurity: false,
    }),
    bankWizardRouter,
);

app.use((req, res, next) => {
    // Default to JSON content type for all subsequent responses
    res.type('application/json');
    // https://stackoverflow.com/a/22339262/2952356
    // `process.env.npm_package_version` only works if you use npm start to run the app.
    res.set('Application-Version', process.env.npm_package_version);

    next();
});

app.use((err, req, res, next) => {
    // Get pino to attach the correct error and stack trace to the log entry
    // https://github.com/pinojs/pino-http/issues/61
    res.err = {
        name: err.name,
        message: err.message,
        stack: err.stack,
    };

    // forward the centralised error handler
    next(err);
});

// Central error handler
// https://www.joyent.com/node-js/production/design/errors
// https://github.com/i0natan/nodebestpractices/blob/master/sections/errorhandling/centralizedhandling.md
app.use(errorHandler);

module.exports = app;
