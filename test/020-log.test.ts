import { expect } from 'chai';
import sinon from 'sinon';
import Kronos from '../src/index.js';

describe('CronManager log functionality', () => {
    afterEach(() => {
        sinon.restore();
    });

    it('logs expected messages on loop', async () => {
        const logFake = sinon.fake();
        const cm = new Kronos({
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
    });
});
