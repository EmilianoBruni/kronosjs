import Fastify, { FastifyInstance } from 'fastify';
import { KLogOptions } from '@/types.js';
import type Kronos from './Kronos.js';

class HttpServer {
    private fastify: FastifyInstance;
    private port: number;
    private host: string;
    private isStarted: boolean = false;
    private kronos: Kronos;

    constructor(
        kronos: Kronos,
        logConfig: boolean | KLogOptions | undefined,
        port: number = 3000,
        host: string = '0.0.0.0'
    ) {
        this.kronos = kronos;
        this.port = port;
        this.host = host;

        // Initialize Fastify server with logger configuration
        let logger = logConfig;
        if (logger) {
            if (logger === true) logger = { level: 'info' };
            if (!logger.formatters || !logger.formatters.level) {
                // if not defined, level will return level label instead of number
                // to be compatible with Loki
                logger.formatters = {
                    level(label: string) {
                        return { level: label };
                    }
                };
            }
        }

        this.fastify = Fastify({ logger });

        // Configure routes immediately after initialization
        this.#configureRoutes();
    }

    /**
     * Configure server routes
     */
    #configureRoutes(): void {
        const f = this.fastify;
        const { jobs } = this.kronos;
        f.get('/health', async () => {
            return { status: 'ok' };
        });
        // /api/jobs
        f.get('/api/jobs', async () => {
            const jobsArray = Array.from(jobs.values()).map(job => job.name);
            return { total: jobsArray.length, items: jobsArray };
        });

        // /api/jobs/:jobName
        f.get('/api/jobs/:jobName', async (request, reply) => {
            const { jobName } = request.params as { jobName: string };
            const job = jobs.get(jobName);
            if (!job) {
                reply.status(404);
                return { error: 'Job not found' };
            }
            return {
                name: job.name,
                cronTime: job.cronTime,
                isActive: job.isActive,
                isRunning: job.isCallbackRunning,
                lastDate: job.lastDate,
                nextDate: job.nextDate
            };
        });

        // /api/jobs/:jobName/start
        f.post('/api/jobs/:jobName/start', async (request, reply) => {
            const { jobName } = request.params as { jobName: string };
            const job = jobs.get(jobName);
            if (!job) {
                reply.status(404);
                return { result: false, status: 'Job not found' };
            }
            if (job.isActive) {
                return { result: true, status: 'Job is already running' };
            }
            job.start();
            return { result: true, status: 'Job started' };
        });

        // /api/jobs/:jobName/stop
        f.post('/api/jobs/:jobName/stop', async (request, reply) => {
            const { jobName } = request.params as { jobName: string };
            const job = jobs.get(jobName);
            if (!job) {
                reply.status(404);
                return { result: false, status: 'Job not found' };
            }
            if (!job.isActive) {
                return { result: true, status: 'Job is not running' };
            }
            job.stop();
            return { result: true, status: 'Job stopped' };
        });

        // DELETE api/jobs/:jobName
        f.delete('/api/jobs/:jobName', async (request, reply) => {
            const { jobName } = request.params as { jobName: string };
            const job = jobs.get(jobName);
            if (!job) {
                reply.status(404);
                return { result: false, status: 'Job not found' };
            }
            await this.kronos.remove(jobName, true);
            return { result: true, status: 'Job removed' };
        });
    }

    /**
     * Start the HTTP server
     */
    public async start(): Promise<void> {
        if (this.isStarted) {
            throw new Error('Server is already started');
        }

        try {
            await this.fastify.ready();
            await this.fastify.listen({ port: this.port, host: this.host });
            this.isStarted = true;
            this.fastify.log.info(
                `Server listening on ${this.host}:${this.port}`
            );
        } catch (err) {
            this.fastify.log.error(err);
            throw err;
        }
    }

    /**
     * Stop the HTTP server
     */
    public async stop(): Promise<void> {
        if (!this.isStarted) {
            return;
        }

        try {
            await this.fastify.close();
            this.isStarted = false;
            this.fastify.log.info('Server stopped');
        } catch (err) {
            this.fastify.log.error(err);
            throw err;
        }
    }

    /**
     * Get the underlying Fastify instance for advanced configuration
     */
    public getFastifyInstance(): FastifyInstance {
        return this.fastify;
    }

    /**
     * Check if server is running
     */
    public isRunning(): boolean {
        return this.isStarted;
    }

    /**
     * Update server configuration
     */
    public setPort(port: number): void {
        if (this.isStarted) {
            throw new Error('Cannot change port while server is running');
        }
        this.port = port;
    }

    public setHost(host: string): void {
        if (this.isStarted) {
            throw new Error('Cannot change host while server is running');
        }
        this.host = host;
    }
}

export default HttpServer;
