import { expect } from 'chai';
import Kronos from '../src/index.js';
import type { FastifyInstance } from 'fastify';
import { hostname } from 'os';

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

    it('should return system information from /api/sysinfo', async () => {
        const response = await fastify.inject({
            method: 'GET',
            url: '/api/sysinfo'
        });

        const payload = JSON.parse(response.payload);

        // Check top-level structure
        expect(payload).to.have.property('service');

        const { service } = payload;

        // Check service properties
        expect(service).to.have.property('name');
        expect(service.name).to.be.a('string');

        expect(service).to.have.property('version');
        expect(service.version).to.have.property('kronosjs');
        expect(service.version).to.have.property('node');
        expect(service.version).to.have.property('fastify');
        expect(service.version.node).to.be.a('string');
        expect(service.version.fastify).to.be.a('string');

        expect(service).to.have.property('hostname');
        expect(service.hostname).to.be.a('string');
        // hostname must be current hostname
        expect(service.hostname).to.equal(hostname());

        expect(service).to.have.property('debug');
        expect(service.debug).to.be.a('boolean');
        // debug must match current debug mode
        expect(service.debug).to.equal(process.env.NODE_ENV !== 'production');

        expect(service).to.have.property('uptime');
        expect(service.uptime).to.be.a('number');
        expect(service.uptime).to.be.at.least(0);

        expect(service).to.have.property('startTime');
        expect(service.startTime).to.be.a('string');
        // Verify it's a valid ISO date string
        expect(new Date(service.startTime).toISOString()).to.equal(
            service.startTime
        );

        expect(service).to.have.property('pid');
        expect(service.pid).to.be.a('number');
        expect(service.pid).to.equal(process.pid);
    });

    it('should serve favicon.ico', async () => {
        const response = await fastify.inject({
            method: 'GET',
            url: '/favicon.ico'
        });

        expect(response.statusCode).to.equal(200);
        expect(response.headers['content-type']).to.equal(
            'image/vnd.microsoft.icon'
        );
        expect(response.rawPayload).to.be.instanceOf(Buffer);
        expect(response.rawPayload.length).to.be.greaterThan(0);
    });
});
