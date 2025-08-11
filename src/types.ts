import { CronJob, CronJobParams } from 'cron';

export type CJLog = (message?: any, ...optionalParams: any[]) => void; // eslint-disable-line @typescript-eslint/no-explicit-any

export type CJBaseParams = CronJobParams;
export type CJBaseJob = CronJob;

export type CJNamedParams = CJBaseParams & Required<Pick<CJBaseParams, 'name'>>;

export type CJParams = CJNamedParams & {
    log?: CJLog;
};

export type CJNamedJob = CJBaseJob & Required<Pick<CJBaseJob, 'name'>>;

export type CJJob = CJNamedJob;
