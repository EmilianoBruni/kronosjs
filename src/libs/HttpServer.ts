import Fastify, { FastifyInstance } from 'fastify';
import { KLogOptions } from '@/types.js';

class HttpServer {
    private fastify: FastifyInstance;
    private port: number;
    private host: string;
    private isStarted: boolean = false;

    constructor(
        logConfig: boolean | KLogOptions | undefined,
        port: number = 3000,
        host: string = '0.0.0.0'
    ) {
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
        this.configureRoutes();
    }

    /**
     * Configure server routes
     */
    private configureRoutes(): void {
        this.fastify.get('/health', async () => {
            return { status: 'ok' };
        });
        // Add more routes as needed
    }

    /**
     * Add custom route to the server
     */
    // public addRoute(
    //     method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    //     url: string,
    //     handler: (request: any, reply: any) => any
    // ): void {
    //     const methodName = method.toLowerCase() as
    //         | 'get'
    //         | 'post'
    //         | 'put'
    //         | 'delete'
    //         | 'patch';
    //     this.fastify[methodName](url, handler);
    // }

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
