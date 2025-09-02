import type { KBaseParams, KJob, KConfig } from '../types.js';
import { CronJob } from 'cron';
import ansis from 'ansis';
import figures from 'figures';
import dayjs from 'dayjs';
import DirectoryImport from './DirectoryImport.js';
import Crontab from './Crontab.js';

const className = 'Cron Job Manager';

const Kronos = class {
    jobs: Map<string, KJob> = new Map();
    config: KConfig;
    crontab: Awaited<ReturnType<typeof Crontab>> | undefined;

    public static async create(config: KConfig) {
        const instance = new Kronos(config);
        await instance.createCrontab();
        return instance;
    }

    constructor(config: KConfig) {
        this.jobs = new Map();
        this.config = config;
        if (this.config.jobsDir && !this.config.jobsDir.writeable) {
            this.config.jobsDir.writeable = false;
        }
        if (!this.config.name) {
            this.config.name = className;
        }
    }

    async createCrontab() {
        const crontab = await Crontab(this.config.cronTabPath);
        this.crontab = crontab;
        return crontab;
    }

    from(cjParamsOrJob: KBaseParams | KJob | CronJob): KJob {
        if (!cjParamsOrJob.name) {
            // generate a random name
            cjParamsOrJob.name = `cron-job-${Math.random().toString(36).substring(2, 15)}`;
        }
        if (cjParamsOrJob instanceof CronJob) {
            const job = cjParamsOrJob as KJob;
            this.jobs.set(cjParamsOrJob.name, job);
            return job;
        }
        //
        const job = CronJob.from(cjParamsOrJob) as KJob;
        this.jobs.set(cjParamsOrJob.name, job);
        return job;
    }

    add(cjParams: KBaseParams | KJob | CronJob): KJob {
        return this.from(cjParams);
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
        this.stop();
        if (this.crontab) await this.crontab.close();
    }

    async reloadAll() {
        if (this.count() !== 0) this.removeAll();
        // TODO: implement reload logic
        this._importFromDirectory();
    }

    list() {
        return this.jobs;
    }

    listAsArray() {
        return Array.from(this.jobs.values());
    }

    _importFromDirectory() {
        if (this.config.jobsDir === undefined || !this.config.jobsDir.base)
            return;
        const directoryImport = new DirectoryImport({
            path: this.config.jobsDir.base,
            log: this._log
        });
        const modules = directoryImport.modules();
    }

    async loop() {
        // main function loop
        this._log(ansis.greenBright(`${this.config.name} starting...`));
        this._log(
            ansis.blueBright(figures.lineDownRight),
            'Loading cron jobs...'
        );
        this._log('Cron started', ansis.green(figures.tick));
    }

    // first type of log... log raw to log function
    _log_raw(...args: unknown[]) {
        if (!this.config.log) return;
        const log = this.config.log;
        log(...args);
    }

    // second type of log.. _log_raw_with timestamp
    _log(...args: unknown[]) {
        const timestamp = dayjs().format();
        this._log_raw(`[${ansis.magentaBright(timestamp)}]`, ...args);
    }

    // third type of log... _log with job name usually for start/stop
    _log_cron(jobName: string, ...args: unknown[]) {
        this._log(
            ansis.yellowBright(
                `${jobName} ${figures.lineBold}${figures.triangleRight}`
            ),
            ...args
        );
    }
};

export default Kronos;
