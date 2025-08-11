import tap from 'tap';
import sinon from 'sinon';
import CronManager from '../src/index.js';
import { CJBaseParams } from '@/types.js';
import { CronJob } from 'cron/dist/job.js';

// CronManager is a constructible class
tap.test('CronManager is a constructible class', t => {
    t.type(CronManager, 'function', 'CronManager is a function/class');
    const cm = new CronManager();
    t.ok(cm, 'instance created');
    t.end();
});

// Can register and manually run a job if API is available
tap.test('Register and run a job every second', async t => {
    const cm = new CronManager();

    t.ok('add' in cm, 'add method is available');
    t.ok('from' in cm, 'from method is available');

    // const onTick = sinon.fake.returns(true);
    const onTick = sinon.spy();
    const jobDef: CJBaseParams = {
        name: 'test-job',
        cronTime: `* * * * * *`,
        start: false,
        onTick
    };

    // Add job
    const job = cm.add(jobDef);

    t.ok(job.name == jobDef.name, 'job added with correct name');

    t.ok(onTick.notCalled, 'onTick not called');

    const clock = sinon.useFakeTimers();

    job.start();
    t.ok(job.isActive, 'job is active after start');
    clock.tick(1000);
    t.ok(job.isActive, 'job is still active');

    job.stop();
    t.ok(!job.isActive, 'job is no more active after stop');

    t.ok(
        onTick.calledOnce,
        'onTick called once after job started and clock ticked'
    );

    onTick.resetHistory();

    job.start();
    for (let i = 0; i < 5; i++) {
        clock.tick(1000);
    }

    job.stop();

    t.ok(
        onTick.callCount === 5,
        'onTick called five times after job started and clock ticked'
    );
});

tap.test('Get job by name or id and remove', t => {
    const cm = new CronManager();
    const jobDef: CJBaseParams = {
        name: 'test-job',
        cronTime: `* * * * * *`,
        start: false,
        onTick: () => {}
    };
    const job = cm.add(jobDef);
    t.equal(cm.job('test-job'), job, 'job retrieved by name');
    t.equal(cm.job(0), job, 'job retrieved by id');
    t.equal(cm.count(), 1, 'job count is correct');

    const job2 = cm.add({
        name: 'another-job',
        cronTime: `* * * * * *`,
        start: false,
        onTick: () => {}
    });
    t.equal(cm.count(), 2, 'job count is correct after adding another job');

    t.equal(cm.job('another-job'), job2, 'job retrieved by name');
    t.equal(cm.job(1), job2, 'job retrieved by id');

    cm.remove(job);
    t.equal(cm.count(), 1, 'job count is correct after removal');
    t.equal(cm.job('test-job'), undefined, 'job removed by instance');

    t.equal(cm.job('another-job'), job2, 'another job still exists');
    t.equal(cm.job(0), job2, 'another job still exists by id');

    t.end();
});

// add a CronTab instance
tap.test('Add a CronTab instance', t => {
    const cm = new CronManager();

    const job = new CronJob('* * * * * *', () => {}, null, false);

    const jobNamed = cm.add(job);

    t.equal(
        cm.count(),
        1,
        'job count is correct after adding CronTab instance'
    );
    t.equal(cm.job(0), jobNamed, 'CronTab instance retrieved by id');
    t.ok(
        typeof jobNamed.name === 'string',
        'CronTab instance name is a string'
    );

    t.end();
});

tap.teardown(() => {
    sinon.restore();
});
