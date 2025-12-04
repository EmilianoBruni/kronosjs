import readline from 'readline';
import type Kronos from './Kronos.js';

export class ListenKeyPress {
    private rl: readline.Interface;
    private kronos: Kronos;
    private prevKey: string = '';
    private termOut = process.stdout.write.bind(process.stdout);

    constructor(kronos: Kronos) {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            terminal: false
        });
        readline.emitKeypressEvents(process.stdin);
        if (process.stdin.isTTY) {
            process.stdin.setRawMode(true);
            process.stdin.on('keypress', (key, data) => {
                // if (data.ctrl) {
                //     process.stdin.setRawMode(false);
                //     process.stdin.pause();
                // } else {
                this._process(key, data);
                // }
            });
        }
        this.kronos = kronos;
    }

    private async _process(key: string, data: readline.Key) {
        if (key === 'l') {
            this.#printJobsList();
        } else if (key === 'h') {
            this.#printHelp();
        } else if (key === 'q' || (data.sequence === '\u0003' && data.ctrl)) {
            await this.kronos.close();
            process.stdin.setRawMode(false);
            process.stdin.pause();
            process.stdin.unref();
            process.exit(0);
        } else if (key >= '0' && key <= '9' && this.prevKey === 'r') {
            this.#manualRunJob(parseInt(key));
        }
        this.prevKey = key;
    }

    #printHelp() {
        this.termOut('\nKronos Key Press Commands:\n');
        this.termOut('  l - List all cron jobs and their status\n');
        this.termOut('  h - Show this help message\n');
        this.termOut('  r + [0-9] - Manually run a cron job by its index\n');
        this.termOut('  q - Quit the application\n');
    }

    #printJobsList() {
        let maxNameLength = 0;
        let out = '';
        const jobs = this.kronos.jobs;
        let i = 1;
        jobs.forEach((job, name) => {
            if (name.length > maxNameLength) {
                maxNameLength = name.length;
            }
        });
        jobs.forEach((job, name) => {
            const nextDate = job.cronTime.getNextDateFrom(new Date()).toISO();
            out += `\t#${i++}\t${name.padEnd(maxNameLength, ' ')}\t${
                job.isActive ? 'Yes' : 'No'
            }\t${
                job.isCallbackRunning ? 'Running' : 'Stopped'
            }\t\t${nextDate}\n`;
        });
        const nameTitle = 'Name'.padEnd(maxNameLength, ' ');
        out =
            '\nCron Jobs List:\n' +
            `\tIdx\t${nameTitle}\tActive\tStatus\t\tNext Run\n` +
            out;
        this.termOut(`${out}\n`);
    }

    #manualRunJob(index: number) {
        const job = this.kronos.job(index - 1);
        if (!job) {
            this.termOut(`\nNo job found at index #${index}\n`);
            return;
        }
        this.termOut(`\nManually running job: ${job.name}\n`);
        job.fireOnTick();
    }
}
