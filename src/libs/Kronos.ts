import type { KNamedParams, KJob, KConfig, KLog } from '../types.js';
import { CronJob } from 'cron';
import DirectoryImport from './DirectoryImport.js';
import Crontab from './Crontab.js';
import LoggerCreate from './Logger.js';
import { EventEmitter } from 'node:events';
import HttpServer from './HttpServer.js';

const className = 'Cron Job Manager';

class Kronos extends EventEmitter {
    jobs: Map<string, KJob> = new Map();
    config: KConfig;
    crontab: Awaited<ReturnType<typeof Crontab>> | undefined;
    directoryImport: DirectoryImport | undefined;
    log: KLog;
    httpServer: HttpServer | undefined;

    public static async create(config: KConfig) {
        const instance = new Kronos(config);
        instance.log.info(`${instance.config.name} starting...`);
        await instance.createCrontab();
        await instance.#createDirectoryImport();
        instance.log.debug('Loading cron jobs...');
        await instance.reloadAll();
        instance.log.info('Cron started');
        if (instance.httpServer) {
            await instance.httpServer.start();
        }
        return instance;
    }

    constructor(config: KConfig) {
        super();
        this.jobs = new Map();
        this.config = config || {};
        if (this.config.jobsDir && !this.config.jobsDir.writeable) {
            this.config.jobsDir.writeable = false;
        }
        if (!this.config.name) this.config.name = className;
        const logger =
            this.config.logger && this.config.logger === true
                ? { level: 'info' }
                : this.config.logger === false
                  ? undefined
                  : this.config.logger;
        this.log = LoggerCreate({
            logger: logger,
            loggerInstance: this.config.loggerInstance
        }) as KLog;
        if (this.config.httpServer) {
            this.httpServer = new HttpServer(
                this,
                this.config.logger,
                this.config.httpServer.port,
                this.config.httpServer.host
            );
        }
    }

    async onDirImportChange() {
        this.log.debug('Jobs directory changed, reloading jobs...');
        await this.reloadAll();
    }

    async createCrontab() {
        if (!this.config.cronTabPath) return;
        const crontab = await Crontab(this.config.cronTabPath);
        this.crontab = crontab;
        //  set callback to receive crontab changes notifications
        this.crontab.onDidChange(this.onCrontabChange.bind(this));
        return crontab;
    }

    async #createDirectoryImport() {
        if (this.config.jobsDir && !this.config.jobsDir.writeable) {
            this.directoryImport = await DirectoryImport.create({
                path: this.config.jobsDir.base,
                log: this.log
            });
            // watch for changes in the directory emit event to Kronos for reloading jobs
            this.directoryImport.on(
                'change',
                this.onDirImportChange.bind(this)
            );
        }
    }

    async onCrontabChange() {
        // for now reload all without checking differences from old to new
        await this.reloadAll();
    }

    add(cjParamsOrJob: KNamedParams<null, null> | KJob | CronJob): KJob {
        if (!cjParamsOrJob.name) {
            // TODO: consider better name than a generate a random one
            cjParamsOrJob.name = `cron-job-${Math.random().toString(36).substring(2, 15)}`;
        }
        // search job in crontab
        if (this.crontab) {
            const cronTime = this.crontab.get(cjParamsOrJob.name);
            if (cronTime) {
                cjParamsOrJob.cronTime = cronTime;
            } else {
                // TODO: better definition of cronTime when is a DateTime
                this.crontab.set(
                    cjParamsOrJob.name,
                    cjParamsOrJob.cronTime as string
                );
            }
        }

        if (cjParamsOrJob instanceof CronJob) {
            const job = cjParamsOrJob as KJob;
            job.log = this.log.child({ jobId: job.name });
            this.jobs.set(cjParamsOrJob.name, job);
            return job;
        }

        const job = CronJob.from(cjParamsOrJob) as KJob;
        job.log = this.log.child({ jobId: job.name });
        this.jobs.set(cjParamsOrJob.name, job);
        return job;
    }

    count() {
        return this.jobs.size;
    }

    job(nameOrId: string | number) {
        if (typeof nameOrId === 'string') {
            return this.jobs.get(nameOrId);
        }
        return Array.from(this.jobs.values())[nameOrId];
    }

    async remove(jobOrName: string | KJob, force: boolean = false) {
        const job =
            jobOrName instanceof CronJob ? jobOrName : this.jobs.get(jobOrName);
        if (!job) return;
        if (force) {
            job.stop();
        } else {
            // wait for job not to be active
            while (job.isActive) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
        this.jobs.delete(job.name);
    }

    async removeAll(force: boolean = false) {
        for (const job of this.jobs.values()) {
            await this.remove(job, force);
        }
    }

    start() {
        for (const job of this.jobs.values()) {
            job.start();
        }
    }

    stop() {
        for (const job of this.jobs.values()) {
            job.stop();
        }
    }

    async close() {
        this.log.info(`${this.config.name} shutting down...`);
        this.stop();
        if (this.crontab) await this.crontab.close();
        if (this.directoryImport) await this.directoryImport.close();
        if (this.httpServer) await this.httpServer.stop();
    }

    async reloadAll() {
        if (this.count() !== 0) await this.removeAll(true);
        // import all modules from file
        await this._importFromDirectory();
        this.emit('loaded');
    }

    list() {
        return this.jobs;
    }

    listAsArray() {
        return Array.from(this.jobs.values());
    }

    async _importFromDirectory() {
        if (
            this.config.jobsDir === undefined ||
            !this.config.jobsDir.base ||
            !this.directoryImport
        )
            return;
        const modules = this.directoryImport.modules();
        for await (const mod of modules) {
            const moduleData = mod.moduleData;
            const job = moduleData.default;
            const configSrc = moduleData.config ? moduleData.config : undefined;
            const config = configSrc ? await configSrc() : undefined;
            const jobCfg: KNamedParams<null, null> = {
                cronTime: config?.schedule ? config.schedule : '0 * * * * *',
                start: config?.start !== undefined ? config.start : false,
                name: config?.name ? config.name : mod.moduleName,
                onTick: job
            };
            this.add(jobCfg);
        }
    }
}

export default Kronos;
