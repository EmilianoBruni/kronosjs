import { expect } from 'chai';
import sinon from 'sinon';
import CronManager from '@/index.js';
import type { CJBaseParams } from '@/index.js';
import { CronJob } from 'cron';

describe('CronManager', () => {
    afterEach(() => {
        sinon.restore();
    });

    it('is a constructible class', () => {
        expect(CronManager).to.be.a('function');
        const cm = new CronManager();
        expect(cm).to.be.not.equal(null);
    });

    it('can register and manually run a job every second', () => {
        const cm = new CronManager();

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
        const cm = new CronManager();
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
        const cm = new CronManager();

        const job = new CronJob('* * * * * *', () => {}, null, false);

        const jobNamed = cm.add(job);

        expect(cm.count()).to.equal(1);
        expect(cm.job(0)).to.equal(jobNamed);
        expect(jobNamed.name).to.be.a('string');
    });
});
