import { CronJob, CronJobParams } from 'cron';
import { Type, type Static } from '@sinclair/typebox';
import type { Logger, LoggerOptions } from 'pino';

export type KLog = Logger;
export type KLogOptions = LoggerOptions & {
    stream?: { write: (msg: string) => void };
};

export type CronContext<C> = C extends null ? KBaseJob : NonNullable<C>;
export type CronCallback<C, WithOnCompleteBool extends boolean = false> = (
    this: CronContext<C>,
    onComplete: WithOnCompleteBool extends true ? CronOnCompleteCallback : never
) => void | Promise<void>;
export type CronOnCompleteCallback = () => void | Promise<void>;

export type CronCommand<
    C,
    WithOnCompleteBool extends boolean = false
> = CronCallback<C, WithOnCompleteBool>;

export type CronOnCompleteCommand = CronOnCompleteCallback;

export type WithOnComplete<OC> = OC extends null ? false : true;

export type KBaseParams = CronJobParams;
export type KBaseJob = CronJob & { log?: KLog };

export type KNamedParams<OC, C> = KBaseParams & {
    name: string;
    log?: KLog;
    onTick: CronCommand<C, WithOnComplete<OC>>;
};

export type KParams<OC, C> = KNamedParams<OC, C> & {
    log?: KLog;
};

export type KNamedJob = KBaseJob & Required<Pick<KBaseJob, 'name'>>;

export type KJob = KNamedJob;

/**
 * Configuration options for the Cron Job manager class.
 *
 * @property dir - Optional directory configuration.
 * @property dir.base - The base directory path.
 * @property dir.writeable - Whether the directory is writeable. Optional.
 * @property log - Optional logging configuration of type `CJLog`.
 * @property name - Optional name for the configuration.
 */
export type KConfig = {
    cronTabPath?: string;
    jobsDir?: {
        base: string;
        writeable?: boolean;
    };
    name?: string;
    logger?: boolean | KLogOptions;
    loggerInstance?: KLog;
    httpServer?: {
        port: number;
        host?: string;
        path?: string;
    };
    terminal?: boolean;
};

/**
 * Schema and type definition for a cron job configuration object.
 *
 * @property schedule - The schedule for the cron job, which can be either a string (e.g., cron expression) or a Date object.
 * @property timezone - (Optional) The timezone in which the cron job should run, specified as a string.
 * @property start - (Optional) Indicates whether the cron job should start automatically. Defaults to true.
 */
export const KCronConfigSchema = Type.Record(
    Type.String(),
    Type.Object({
        name: Type.Optional(Type.String()),
        schedule: Type.Optional(
            Type.Union([Type.String(), Type.String({ format: 'date-time' })], {
                default: '* * * * *'
            })
        ),
        timezone: Type.Optional(Type.String({ default: 'UTC' })),
        start: Type.Optional(Type.Boolean({ default: true }))
    })
);

type ValueOf<T> = T[keyof T];
export type KCronConfig = ValueOf<Static<typeof KCronConfigSchema>>;

export type KCronJobConfig =
    | (() => KCronConfig)
    | (() => Promise<KCronConfig>)
    | KCronConfig;

/**
 * Represents the structure of a cron job module.
 *
 * @property default - An asynchronous function that executes the main logic of the cron job.
 * @property config - (Optional) An asynchronous function that returns the configuration for the cron job.
 * @property name - (Optional) The name of the cron job module.
 */
export type KCronJob = {
    default: () => Promise<void>;
    config?: KCronJobConfig;
    name?: string;
};
