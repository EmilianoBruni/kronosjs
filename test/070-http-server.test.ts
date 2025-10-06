import { expect } from 'chai';
import Kronos from '../src/index.js';
import type { FastifyInstance } from 'fastify';

describe('HTTP Server functionality', () => {
    let cm: Kronos;
    let fastify: FastifyInstance;

    beforeEach(async () => {
        cm = await Kronos.create({
            name: 'Hello World example',
            httpServer: { port: 3000 }
        });

        const fastifyInstance = cm.httpServer?.getFastifyInstance();
        if (!fastifyInstance) {
            throw new Error('Fastify instance not available');
        }
        fastify = fastifyInstance;
    });

    afterEach(async () => {
        await cm.close();
    });

    it('should have a working health endpoint', async () => {
        const response = await fastify.inject({
            method: 'GET',
            url: '/health'
        });

        const payload = JSON.parse(response.payload);
        expect(payload).to.have.property('status', 'ok');
    });

    it('should manage jobs through API endpoints', async () => {
        // Add a job
        cm.add({
            name: 'hello_world',
            cronTime: '*/2 * * * * *',
            onTick: function () {
                if (this.log) this.log.info('Hello, World!');
            },
            start: true
        });

        // Test get all jobs
        let response = await fastify.inject({
            method: 'GET',
            url: '/api/jobs'
        });
        let payload = JSON.parse(response.payload);
        expect(payload).to.have.property('total', 1);
        expect(payload).to.have.property('items');
        expect(payload.items).to.include('hello_world');

        // Test get specific job
        response = await fastify.inject({
            method: 'GET',
            url: '/api/jobs/hello_world'
        });
        payload = JSON.parse(response.payload);
        expect(payload).to.have.property('name', 'hello_world');

        // Test get non-existent job
        response = await fastify.inject({
            method: 'GET',
            url: '/api/jobs/non_existent_job'
        });
        payload = JSON.parse(response.payload);
        expect(payload).to.have.property('error', 'Job not found');

        // Test start job (should be already running)
        response = await fastify.inject({
            method: 'POST',
            url: '/api/jobs/hello_world/start'
        });
        payload = JSON.parse(response.payload);
        expect(payload).to.have.property('result', true);
        expect(payload).to.have.property('status', 'Job is already running');
    });

    it('should stop and remove jobs through API', async () => {
        // Add a job
        cm.add({
            name: 'hello_world',
            cronTime: '*/2 * * * * *',
            onTick: function () {
                if (this.log) this.log.info('Hello, World!');
            },
            start: true
        });

        // Wait a bit, then stop the job
        await new Promise(resolve => setTimeout(resolve, 500));

        let response = await fastify.inject({
            method: 'POST',
            url: '/api/jobs/hello_world/stop'
        });
        let payload = JSON.parse(response.payload);
        expect(payload).to.have.property('result', true);
        expect(payload).to.have.property('status', 'Job stopped');

        // Check job status after stopping
        response = await fastify.inject({
            method: 'GET',
            url: '/api/jobs/hello_world'
        });
        payload = JSON.parse(response.payload);
        expect(payload).to.have.property('isActive', false);

        // Remove the job
        response = await fastify.inject({
            method: 'DELETE',
            url: '/api/jobs/hello_world'
        });
        payload = JSON.parse(response.payload);
        expect(payload).to.have.property('result', true);
        expect(payload).to.have.property('status', 'Job removed');

        // Verify job is removed
        response = await fastify.inject({
            method: 'GET',
            url: '/api/jobs'
        });
        payload = JSON.parse(response.payload);
        expect(payload).to.have.property('total', 0);
        expect(payload.items).to.be.an('array').that.has.lengthOf(0);
    });
});
