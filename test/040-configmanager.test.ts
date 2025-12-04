import { describe, it, beforeEach } from 'mocha';
import { expect } from 'chai';
import { ConfigManager } from '@/libs/ConfigManager.js';
import type { KCronConfig } from '@/types.ts';
import { unlinkSync } from 'node:fs';
import { waitForDebugger } from 'node:inspector';

const tempDir = '/tmp';
const fileName = 'test-config.json';

const sampleConfig: Record<string, KCronConfig> = {
    job1: {
        schedule: '* * * * *',
        start: true
    },
    job2: {
        schedule: '0 0 * * *',
        timezone: 'UTC'
    }
};

describe('ConfigManager', () => {
    let manager: ConfigManager;

    after(() => {
        // delete config file at the end of tests
        unlinkSync(`${tempDir}/${fileName}`);
    });

    beforeEach(() => {
        manager = new ConfigManager(tempDir, fileName);
        manager.clear();
    });

    it('should set and get store', () => {
        manager.store = sampleConfig;
        expect(manager.store).to.deep.equal(sampleConfig);
    });

    it('should get and set individual keys', () => {
        manager.set('job1', sampleConfig.job1);
        expect(manager.get('job1', sampleConfig.job1)).to.deep.equal(
            sampleConfig.job1
        );
    });

    it('should check existence of a key', () => {
        manager.set('job1', sampleConfig.job1);
        expect(manager.has('job1')).to.equal(true);
        expect(manager.has('jobX')).to.equal(false);
    });

    it('should delete a key', () => {
        manager.set('job1', sampleConfig.job1);
        manager.delete('job1');
        expect(manager.has('job1')).to.equal(false);
    });

    it('should clear all configs', () => {
        manager.set(sampleConfig);
        manager.clear();
        expect(manager.size).to.equal(0);
    });

    it('should return the correct size', () => {
        manager.set(sampleConfig);
        expect(manager.size).to.equal(2);
    });

    it('should call onDidAnyChange callback', done => {
        let called = false;
        manager.onDidAnyChange(() => {
            called = true;
        });
        manager.set('job1', sampleConfig.job1);
        setTimeout(() => {
            expect(called).to.equal(true);
            done();
        }, 10);
    });
    it('apply default values', () => {
        manager.set('job3', {});
        expect(manager.get('job3')).to.deep.equal({
            schedule: '* * * * *',
            timezone: 'UTC',
            start: true,
            waitForCompletion: true
        });
    });
});
