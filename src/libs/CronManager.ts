import type { CJBaseParams, CJJob } from '../types.js';
import { CronJob } from 'cron';

const CronManager = class {
    jobs: Map<string, CJJob> = new Map();

    constructor() {
        this.jobs = new Map();
    }

    from(cjParamsOrJob: CJBaseParams | CJJob | CronJob): CJJob {
        if (!cjParamsOrJob.name) {
            // generate a random name
            cjParamsOrJob.name = `cron-job-${Math.random().toString(36).substring(2, 15)}`;
        }
        if (cjParamsOrJob instanceof CronJob) {
            const job = cjParamsOrJob as CJJob;
            this.jobs.set(cjParamsOrJob.name, job);
            return job;
        }
        //
        const job = CronJob.from(cjParamsOrJob) as CJJob;
        this.jobs.set(cjParamsOrJob.name, job);
        return job;
    }

    add(cjParams: CJBaseParams | CJJob | CronJob): CJJob {
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

    async remove(jobOrName: string | CJJob, force: boolean = false) {
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

    list() {
        return this.jobs;
    }

    listAsArray() {
        return Array.from(this.jobs.values());
    }
};

export default CronManager;
