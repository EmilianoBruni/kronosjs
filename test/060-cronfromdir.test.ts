import { expect } from 'chai';
import { describe, it } from 'mocha';
import { dirname } from 'path';
import Kronos from '@/index.js';
import { unlinkSync, existsSync, readFileSync, writeFileSync } from 'fs';

const __dirname = dirname(__filename);

describe('Import from Directory', () => {
    const tmpFiles: string[] = [];

    afterEach(() => {
        for (const f of tmpFiles) {
            try {
                unlinkSync(f);
            } catch {
                // ignore
            }
        }
        tmpFiles.length = 0;
    });

    it('should import all cron jobs from the specified directory', async () => {
        const cronTabPath = `${__dirname}/060-${Date.now()}.crontab`;
        tmpFiles.push(cronTabPath);
        const cm = await Kronos.create({
            cronTabPath,
            jobsDir: { base: `${__dirname}/jobs` }
        });
        const numberOfJobsInDir = 2; // update this to the actual number of job files in the directory
        try {
            // expect there are two jobs
            expect(cm.count()).to.equal(
                numberOfJobsInDir,
                `There should be ${numberOfJobsInDir} jobs as files in the directory`
            );

            // check crontab file exists, has number of jobs
            expect(existsSync(cronTabPath)).to.be.equal(true);
            const crontabContent = readFileSync(cronTabPath, 'utf-8');
            const lines = crontabContent
                .split('\n')
                .filter(line => line.trim() !== '');
            expect(lines.length).to.equal(
                numberOfJobsInDir,
                `Crontab file should have ${numberOfJobsInDir} lines`
            );

            for (const line of lines) {
                // jobName is the last element of the split
                const lineSplit = [...line.split(' ')];
                const jobName = lineSplit.pop() as string;
                expect(cm.job(jobName)).to.not.equal(
                    undefined,
                    `Job ${jobName} should be registered`
                );
                expect(cm.job(jobName)?.cronTime.toString()).to.equal(
                    lineSplit.join(' ')
                );
            }

            // TODO: test to see if cronTime changes when crontab is manually changed
        } finally {
            cm.close();
        }
    });

    it('should reflect changes in the crontab file', async () => {
        const cronTabPath = `${__dirname}/060-${Date.now()}.crontab`;
        tmpFiles.push(cronTabPath);
        const cm = await Kronos.create({
            cronTabPath,
            jobsDir: { base: `${__dirname}/jobs` }
        });
        const newCronTime = '* 10 * * * *';

        const asyncReload = new Promise<void>(resolve => {
            cm.on('loaded', () => {
                // expect there is two jobs
                expect(cm.count()).to.equal(
                    2,
                    'There should be 2 jobs as files in the directory'
                );
                // expect emptyJobWithSchema has now the correct cronTime
                expect(
                    cm.job('emptyJobWithSchema')?.cronTime.toString()
                ).to.equal(
                    newCronTime,
                    `emptyJobWithSchema should have updated cronTime`
                );

                cm.close();
                resolve();
            });
        });

        // modify the crontab file
        const newCronTabContent = `
${newCronTime} emptyJobWithSchema
0 * * * * * empty
`;
        writeFileSync(cronTabPath, newCronTabContent);

        return asyncReload;
    });

    it('should reflect changes in the cron directory', async () => {
        const cronTabPath = `${__dirname}/060-${Date.now()}.crontab`;
        tmpFiles.push(cronTabPath);
        const cm = await Kronos.create({
            cronTabPath,
            jobsDir: { base: `${__dirname}/jobs` }
        });

        const asyncReload = new Promise<void>(resolve => {
            cm.on('loaded', () => {
                // expect there are three jobs now
                expect(cm.count()).to.equal(
                    3,
                    'There should be 3 jobs as files in the directory'
                );
                expect(cm.job('newfile')).to.not.equal(
                    undefined,
                    'Job newfile should be registered'
                );

                cm.close();
                resolve();
            });
        });

        // add a new file to the directory
        // touch test/jobs/newfile.ts
        writeFileSync(`${__dirname}/jobs/newfile.ts`, '// new file');
        tmpFiles.push(`${__dirname}/jobs/newfile.ts`);

        return asyncReload;
    });
});
