import { expect } from 'chai';
import sinon from 'sinon';
import Kronos from '../src/index.js';
import path from 'path';
import { unlinkSync } from 'fs';

describe('CronManager log functionality', () => {
    afterEach(() => {
        sinon.restore();
    });

    it('logs expected messages on loop', async () => {
        const cronTabPath = path.join(
            process.cwd(),
            'test',
            `020-crontab-${Date.now()}.txt`
        );
        const logFake = sinon.fake();
        const cm = await Kronos.create({
            cronTabPath,
            log: logFake
        });

        await cm.loop();

        expect(logFake.getCall(0).lastArg.toString()).to.include(
            `${cm.config.name} starting...`,
            'Expected log message for starting cronjob'
        );

        expect(logFake.getCall(1).lastArg.toString()).to.include(
            'Loading cron jobs...',
            'Expected log message for loading cronjobs'
        );
        await cm.close();
        unlinkSync(cronTabPath);
    });
});
