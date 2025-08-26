import { CronJob, CronJobParams } from 'cron';
import { Type, type Static } from '@sinclair/typebox';

export type CJLog = (message?: any, ...optionalParams: any[]) => void; // eslint-disable-line @typescript-eslint/no-explicit-any

export type CJBaseParams = CronJobParams;
export type CJBaseJob = CronJob;

export type CJNamedParams = CJBaseParams & Required<Pick<CJBaseParams, 'name'>>;

export type CJParams = CJNamedParams & {
    log?: CJLog;
};

export type CJNamedJob = CJBaseJob & Required<Pick<CJBaseJob, 'name'>>;

export type CJJob = CJNamedJob;

/**
 * Configuration options for the Cron Job manager class.
 *
 * @property dir - Optional directory configuration.
 * @property dir.base - The base directory path.
 * @property dir.writeable - Whether the directory is writeable. Optional.
 * @property log - Optional logging configuration of type `CJLog`.
 * @property name - Optional name for the configuration.
 */
export type CJConfig = {
    dir?: {
        base: string;
        writeable?: boolean;
    };
    log?: CJLog;
    name?: string;
};

/**
 * Schema and type definition for a cron job configuration object.
 *
 * @property schedule - The schedule for the cron job, which can be either a string (e.g., cron expression) or a Date object.
 * @property timezone - (Optional) The timezone in which the cron job should run, specified as a string.
 * @property start - (Optional) Indicates whether the cron job should start automatically. Defaults to true.
 */
export const CJCronConfigSchema = Type.Object({
    schedule: Type.Union([Type.String(), Type.Date()]),
    timezone: Type.Optional(Type.String()),
    start: Type.Optional(Type.Boolean({ default: true }))
});

export type CJCronConfig = Static<typeof CJCronConfigSchema>;

/**
 * Represents the structure of a cron job module.
 *
 * @property default - An asynchronous function that executes the main logic of the cron job.
 * @property config - (Optional) An asynchronous function that returns the configuration for the cron job.
 * @property name - (Optional) The name of the cron job module.
 */
export type CJCronJob = {
    default: () => Promise<void>;
    config?: () => Promise<CJCronConfig>;
    name?: string;
};
