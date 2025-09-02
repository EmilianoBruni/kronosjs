import { KCronConfig } from '@/types.js';

const name = 'emptyJobWithSchema';

async function empty_job() {
    return true;
}

async function config(): Promise<KCronConfig> {
    return {
        schedule: '* 1 * * * *',
        timezone: 'UTC',
        start: true
    };
}

export default empty_job;
export { name, config };
