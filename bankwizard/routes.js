'use strict';

const express = require('express');

const createBankWizardService = require('./bankwizard-service');

const router = express.Router();

router.route('/personal').post((req, res, next) => {
    try {
        const bankWizardService = createBankWizardService();
        const answer = bankWizardService.bankWizardPersonalRequest(req.body);
        res.status(200).json(answer);
    } catch (err) {
        next(err);
    }
});

router.route('/company').post((req, res, next) => {
    try {
        const bankWizardService = createBankWizardService();
        const answer = bankWizardService.bankWizardCompanyRequest(req.body);
        res.status(200).json(answer);
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
