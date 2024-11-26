'use strict';

const request = require('supertest');

const personalRequest = require('../testing/personalRequest');
const companyRequest = require('../testing/companyRequest');

beforeEach(() => {
    jest.resetModules();
});

describe('REST endpoint tests', () => {
    jest.mock('./bankwizard-service', () => ({
        // eslint-disable-next-line no-unused-vars
        bankWizardPersonalRequest: jest.fn((req, res, next) => {
            res.status(200).json('test');
        }),
        // eslint-disable-next-line no-unused-vars
        bankWizardCompanyRequest: jest.fn((req, res, next) => {
            res.status(200).json('test');
        }),
    }));

    // eslint-disable-next-line global-require
    const app = require('../app');

    describe('POST /v2/bankwizard/personal', () => {
        it('should return status 200 and give a normal response when the request is valid', async () => {
            const response = await request(app)
                .post('/v2/bankwizard/personal')
                .send(personalRequest);
            expect(response.status).toEqual(200);
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

    it('should return status 404 for invalid endpoints', async () => {
        const response = await request(app).get('/v2/bankwizard/notanendpoint').send();
        expect(response.status).toEqual(404);
    });
});
