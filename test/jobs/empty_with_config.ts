import { KCronConfig } from '@/types.js';

async function empty_job() {
    return true;
}

async function config(): Promise<KCronConfig> {
    return {
        schedule: '* 1 * * * *',
        timezone: 'UTC',
        start: true,
        name: 'emptyJobWithSchema'
    };
}

export default empty_job;
export { config };
