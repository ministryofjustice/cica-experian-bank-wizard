'use strict';

const express = require('express');

const bankWizardService = require('./bankwizard-service');

const router = express.Router();

router.route('/personal').post(async (req, res, next) => {
    try {
        const response = await bankWizardService.bankWizardRequest(req.body, true);
        res.status(response.status).json(response.body);
    } catch (err) {
        next(err);
    }
});

router.route('/company').post(async (req, res, next) => {
    try {
        const response = await bankWizardService.bankWizardRequest(req.body, false);
        res.status(response.status).json(response.body);
    } catch (err) {
        next(err);
    }
});

router.route('/status').get((req, res, next) => {
    try {
        res.status(200).json({status: 'Service up'});
    } catch (err) {
        next(err);
    }
});

module.exports = router;
