'use strict';

const request = require('supertest');
const app = require('../app');

const personalRequest = {
    firstName: 'John',
    lastName: 'Doe',
    dOB: '2000-01-01',
    sortCode: '01-01-01',
    accountNumber: '12345678',
    rollNumber: '',
    houseNumber: '1',
    street: 'Real Road',
    postCode: 'AA1 1AA',
};

const companyRequest = {
    companyName: 'Test Ltd.',
    sortCode: '01-01-01',
    accountNumber: '12345678',
    rollNumber: '',
    houseNumber: '1',
    street: 'Real Road',
    postCode: 'AA1 1AA',
};

beforeEach(() => {
    jest.resetModules();
});

describe('REST endpoint tests', () => {
    jest.doMock('./bankwizard-service.js', () => {
        const bankwizardServiceMock = {
            bankWizardPersonalRequest: jest.fn(() => true),
            bankWizardCompanyRequest: jest.fn(() => false),
        };
        return () => bankwizardServiceMock;
    });

    describe('POST /v2/bankwizard/personal', () => {
        it('should return status 200 and give a normal response when the request is valid', async () => {
            const response = await request(app)
                .post('/v2/bankwizard/personal')
                .send(personalRequest);
            expect(response.status).toEqual(200);
            expect(response.body).toEqual(true);
        });

        it('should return status 400 when the request is malformed', async () => {
            const response = await request(app)
                .post('/v2/bankwizard/personal')
                .send(companyRequest);
            expect(response.status).toEqual(400);
        });
    });

    describe('POST /v2/bankwizard/company', () => {
        it('should return status 200 and give a normal response when the request is valid', async () => {
            const response = await request(app).post('/v2/bankwizard/company').send(companyRequest);
            expect(response.status).toEqual(200);
            expect(response.body).toEqual(false);
        });

        it('should return status 400 when the request is malformed', async () => {
            const response = await request(app)
                .post('/v2/bankwizard/company')
                .send(personalRequest);
            expect(response.status).toEqual(400);
        });
    });

    describe('GET /v2/bankwizard/status', () => {
        it('should return status 200', async () => {
            const response = await request(app).get('/v2/bankwizard/status').send();
            expect(response.status).toEqual(200);
        });
    });
});
