import { expect } from 'chai';
import sinon from 'sinon';
import Kronos from '@/index.js';
import { CronJob } from 'cron';
import type { KNamedParams } from '@/types.js';

describe('Kronos', () => {
    let cm: InstanceType<typeof Kronos>;

    afterEach(async () => {
        if (cm.close) await cm.close();
        sinon.restore();
    });

    it('is a constructible class', async () => {
        expect(Kronos).to.be.a('function');
        cm = await Kronos.create({});
        expect(cm).to.be.not.equal(null);
    });

    it('can register and manually run a job every second', async () => {
        cm = await Kronos.create({});

        expect(cm).to.have.property('add');

        const onTick = sinon.spy();
        const jobDef: KNamedParams<null, null> = {
            name: 'test-job',
            cronTime: `* * * * * *`,
            start: false,
            onTick,
            waitForCompletion: false
        };

        // Add job
        const job = cm.add(jobDef);

        expect(job.name).to.equal(jobDef.name);
        expect(onTick.notCalled).to.equal(true, 'onTick not called yet');

        const clock = sinon.useFakeTimers();

        expect(job.isActive).to.equal(
            false,
            'Job is not active when added with start: false'
        );

        job.start();
        expect(job.isActive).to.equal(
            true,
            'Job is active because it was started with start()'
        );
        clock.tick(1000);

        job.stop();
        expect(job.isActive).to.equal(false, 'Job is stopped');

        expect(onTick.calledOnce).to.equal(
            true,
            'onTick called once after 1 second'
        );

        onTick.resetHistory();

        job.start();
        for (let i = 0; i < 5; i++) {
            clock.tick(1000);
        }

        job.stop();

        expect(onTick.callCount).to.equal(5);
    });

    it('can get job by name or id and remove', async () => {
        cm = await Kronos.create({});
        const jobDef: KNamedParams<null, null> = {
            name: 'test-job',
            cronTime: `* * * * * *`,
            start: false,
            onTick: () => {}
        };
        const job = cm.add(jobDef);
        expect(cm.job('test-job')).to.equal(job);
        expect(cm.job(0)).to.equal(job);
        expect(cm.count()).to.equal(1);

        const job2 = cm.add({
            name: 'another-job',
            cronTime: `* * * * * *`,
            start: false,
            onTick: () => {}
        });
        expect(cm.count()).to.equal(2);

        expect(cm.job('another-job')).to.equal(job2);
        expect(cm.job(1)).to.equal(job2);

        cm.remove(job);
        expect(cm.count()).to.equal(1);
        expect(cm.job('test-job')).to.equal(undefined);

        expect(cm.job('another-job')).to.equal(job2);
        expect(cm.job(0)).to.equal(job2);
    });

    it('can add a CronTab instance', async () => {
        cm = await Kronos.create({});

        const job = new CronJob('* * * * * *', () => {}, null, false);

        const jobNamed = cm.add(job);

        expect(cm.count()).to.equal(1);
        expect(cm.job(0)).to.equal(jobNamed);
        expect(jobNamed.name).to.be.a('string');
    });

    it('can start and stop all jobs', async () => {
        cm = await Kronos.create({});

        const onTick = sinon.spy();
        const clock = sinon.useFakeTimers({ shouldClearNativeTimers: true });

        const job1 = cm.add({
            name: 'job1',
            cronTime: '* * * * * *',
            start: false,
            onTick,
            waitForCompletion: false
        });
        const job2 = cm.add({
            name: 'job2',
            cronTime: '* * * * * *',
            start: false,
            onTick,
            waitForCompletion: false
        });

        expect(cm.count()).to.equal(2);

        cm.start();
        expect(job1.isActive).to.equal(false);
        expect(job2.isActive).to.equal(false);

        job1.start();
        job2.start();
        expect(job1.isActive).to.equal(true);
        expect(job2.isActive).to.equal(true);

        clock.tick(1000);
        expect(onTick.callCount).to.equal(2);

        clock.tick(1000);
        expect(job1.isActive).to.equal(true);
        expect(job2.isActive).to.equal(true);
        expect(onTick.callCount).to.equal(4);

        cm.stop();
        expect(job1.isActive).to.equal(false);
        expect(job2.isActive).to.equal(false);
    });
}).timeout(5000);
