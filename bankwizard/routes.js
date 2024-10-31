'use strict';

const express = require('express');

const bankWizardService = require('./bankwizard-service');

const router = express.Router();

router.route('/personal').post((req, res, next) => {
    try {
        bankWizardService.bankWizardPersonalRequest(req.body, res, next);
    } catch (err) {
        next(err);
    }
});

router.route('/company').post((req, res, next) => {
    try {
        bankWizardService.bankWizardCompanyRequest(req.body, res, next);
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
