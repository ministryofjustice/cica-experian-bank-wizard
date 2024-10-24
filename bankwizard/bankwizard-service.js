'use strict';

function createBankWizardService() {
    function bankWizardPersonalRequest(body) {
        console.log(body);
        return true;
    }

    function bankWizardCompanyRequest(body) {
        console.log(body);
        return false;
    }

    return Object.freeze({
        bankWizardPersonalRequest,
        bankWizardCompanyRequest,
    });
}

module.exports = createBankWizardService;
