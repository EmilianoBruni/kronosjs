import { expect } from 'chai';
import sinon from 'sinon';
import Kronos from '@/index.js';
import type { CJBaseParams } from '@/index.js';
import { CronJob } from 'cron';

describe('Kronos', () => {
    afterEach(() => {
        sinon.restore();
    });

    it('is a constructible class', () => {
        expect(Kronos).to.be.a('function');
        const cm = new Kronos();
        expect(cm).to.be.not.equal(null);
    });

    it('can register and manually run a job every second', () => {
        const cm = new Kronos();

        expect(cm).to.have.property('add');
        expect(cm).to.have.property('from');

        const onTick = sinon.spy();
        const jobDef: CJBaseParams = {
            name: 'test-job',
            cronTime: `* * * * * *`,
            start: false,
            onTick
        };

        // Add job
        const job = cm.add(jobDef);

        expect(job.name).to.equal(jobDef.name);
        expect(onTick.notCalled).to.equal(true);

        const clock = sinon.useFakeTimers();

        job.start();
        expect(job.isActive).to.equal(true);
        clock.tick(1000);
        expect(job.isActive).to.equal(true);

        job.stop();
        expect(job.isActive).to.equal(false);

        expect(onTick.calledOnce).to.equal(true);

        onTick.resetHistory();

        job.start();
        for (let i = 0; i < 5; i++) {
            clock.tick(1000);
        }

        job.stop();

        expect(onTick.callCount).to.equal(5);
    });

    it('can get job by name or id and remove', () => {
        const cm = new Kronos();
        const jobDef: CJBaseParams = {
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

    it('can add a CronTab instance', () => {
        const cm = new Kronos();

        const job = new CronJob('* * * * * *', () => {}, null, false);

        const jobNamed = cm.add(job);

        expect(cm.count()).to.equal(1);
        expect(cm.job(0)).to.equal(jobNamed);
        expect(jobNamed.name).to.be.a('string');
    });

    it('can start and stop all jobs', () => {
        const cm = new Kronos();

        const onTick = sinon.spy();
        const clock = sinon.useFakeTimers();

        const job1 = cm.add({
            name: 'job1',
            cronTime: '* * * * * *',
            start: false,
            onTick
        });
        const job2 = cm.add({
            name: 'job2',
            cronTime: '* * * * * *',
            start: false,
            onTick
        });

        expect(cm.count()).to.equal(2);

        cm.start();
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
});
