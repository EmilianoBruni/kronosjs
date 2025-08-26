import { CJCronConfig } from '@/types.js';

const name = 'emptyJobWithSchema';

async function empty_job() {
    return true;
}

async function config(): Promise<CJCronConfig> {
    return {
        schedule: '* * * * *',
        timezone: 'UTC',
        start: true
    };
}

export default empty_job;
export { name, config };
