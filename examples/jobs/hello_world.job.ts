import type { KCronConfig, KJob } from '@/index.js';

function run(this: KJob) {
    if (this.log) this.log.info('Hello, World!');
}

const config: KCronConfig = {
    name: 'hello_world_job',
    schedule: '* * * * * *',
    start: true
};

export default run;
export { config };
