import tap from 'tap';
import sinon from 'sinon';
import CronManager from '../src/index.js';

// Can register and manually run a job if API is available
tap.test('test log functionality', async t => {
    const logFake = sinon.fake();

    const cm = new CronManager({
        log: logFake
    });

    await cm.loop();

    t.ok(
        logFake
            .getCall(0)
            .lastArg.toString()
            .includes(`${cm.config.name} starting...`),
        'Expected log message for starting cronjob'
    );

    t.ok(
        logFake.getCall(1).lastArg.toString().includes('Loading cron jobs...'),
        ' Expected log message for loading cronjobs'
    );
});

tap.teardown(() => {
    sinon.restore();
});
