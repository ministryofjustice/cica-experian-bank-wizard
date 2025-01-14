/* eslint-disable no-unused-vars */

'use strict';

const personalRequest = require('../../testing/personalRequest');
const companyRequest = require('../../testing/companyRequest');
const verifyResponse = require('../../testing/verifyResponse');
const bankwizardClient = require('./bankwizard-client');

const accountInformation = {
    sortCode: '01-01-01',
    accountNumber: '12345678',
    checkContext: 'Direct Credit',
    rollNumber: '1A',
};

const address = {
    deliveryPoint: [
        {
            attributes: {
                deliveryType: 'houseNumber',
            },
            $value: '1',
        },
    ],
    postalPoint: [
        {
            attributes: {
                postalType: 'street',
            },
            $value: 'Real Road',
        },
        {
            attributes: {
                postalType: 'postcode',
            },
            $value: 'AA1 1AA',
        },
    ],
};

const personalInformation = {
    personal: {
        firstName: 'John',
        surname: 'Doe',
        dob: '2000-01-31',
    },
    address,
    ownerType: null,
};

const companyInformation = {
    companyName: 'Test Ltd.',
    address,
};

beforeEach(() => {
    jest.resetModules();
});

describe('BankWizard Client', () => {
    jest.mock('soap');

    describe('getBranchData()', () => {
        it('should return the bank data', async () => {
            const response = await bankwizardClient.getBranchData(
                verifyResponse(personalRequest, true),
                'TestToken',
            );

            expect(response.branchName).toEqual('Test branch');
            expect(response.institutionName).toEqual('Test institution');
        });

        it('should set the correct response when there is no branch data', async () => {
            const response = await bankwizardClient.getBranchData(
                verifyResponse(companyRequest, false, [], true, true),
                'TestToken',
            );
            expect(response).toEqual(null);
        });
    });

    describe('submitRequest()', () => {
        it('should correctly format account information from a request', async () => {
            const response = await bankwizardClient.submitRequest(
                personalRequest,
                true,
                'TestToken',
            );

            expect(response['ns1:accountInformation']).toEqual(accountInformation);
        });

        it('should correctly format personal information from a request', async () => {
            const response = await bankwizardClient.submitRequest(
                personalRequest,
                true,
                'TestToken',
            );

            expect(response['ns1:personalInformation']).toEqual(personalInformation);
        });

        it('should correctly format company information from a request', async () => {
            const response = await bankwizardClient.submitRequest(
                companyRequest,
                false,
                'TestToken',
            );

            expect(response['ns1:companyInformation']).toEqual(companyInformation);
        });

        it('should not include company information in a personal request', async () => {
            const req = personalRequest;
            req.companyName = companyRequest.companyName;
            const response = await bankwizardClient.submitRequest(req, true, 'TestToken');
            expect(response['ns1:companyInformation']).toBeUndefined();
        });

        it('should not include personal information in a company request', async () => {
            const req = personalRequest;
            req.companyName = companyRequest.companyName;

            const result = await bankwizardClient.submitRequest(
                personalRequest,
                false,
                'TestToken',
            );
            expect(result['ns1:personalInformation']).toBeUndefined();
        });
    });

    it('should throw an error if only one part of the address is present', async () => {
        const req = personalRequest;
        delete req.houseNumber;
        let errMessage;
        try {
            await bankwizardClient.submitRequest(req, true, 'TestToken');
        } catch (err) {
            errMessage = err.message;
        }
        expect(errMessage).toEqual('Invalid address');
    });

    it('should not include the address if no parts are present', async () => {
        const req = personalRequest;
        delete req.houseNumber;
        delete req.street;
        delete req.postCode;

        const msg = await bankwizardClient.submitRequest(req, true, 'TestToken');
        expect(msg['ns1:personalInformation'].address).toEqual(null);
    });

    it('should throw an error if the date of birth is incorrectly formatted', async () => {
        const req = personalRequest;
        req.dOB = '01-31-2002';
        let errMessage;
        try {
            await bankwizardClient.submitRequest(req, true, 'TestToken');
        } catch (err) {
            errMessage = err.message;
        }
        expect(errMessage).toEqual('Unrecognised date');
    });
});
