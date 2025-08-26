import { expect } from 'chai';

import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import DirectoryImport from '../src/libs/DirectoryImport.js';

// get current working directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('DirectoryImport', () => {
    const dirImport = new DirectoryImport({
        path: `${__dirname}/jobs`,
        log: (...args) => console.log(...args) // eslint-disable-line no-console
    });
    const modules = dirImport.modules();

    it('should import all modules from a directory', () => {
        expect(modules).to.be.an('array');
        expect(modules).to.have.lengthOf(2);
    });

    it('should have correct module information', () => {
        const moduleInfo = modules[0];
        expect(moduleInfo).to.have.property('moduleName').that.equals('empty');

        expect(moduleInfo)
            .to.have.property('modulePath')
            .that.is.a('string')
            .that.equals('/empty.ts');

        expect(moduleInfo).to.have.property('moduleData').that.is.a('object');
    });

    describe('empty cron job', () => {
        it('should correctly import and instantiate the job', async () => {
            const moduleInfo = modules[0];
            // instantiate the job
            const job = moduleInfo.moduleData.default;
            expect(job).to.be.a('function');
            expect(await job()).to.equal(true);
        });
    });
    describe('empty with config cron job', () => {
        it('should correctly import and instantiate the job', async () => {
            const moduleInfo = modules[1];
            // instantiate the job
            const job = moduleInfo.moduleData.default;
            expect(job).to.be.a('function');
            expect(await job()).to.equal(true);
            // get the config
            const config = moduleInfo.moduleData.config;
            expect(config).to.be.a('function');
            if (!config) return;
            const configResult = await config();
            expect(configResult).to.be.an('object');
            expect(configResult)
                .to.have.property('schedule')
                .that.is.a('string')
                .to.be.equal('* * * * *');
            expect(configResult)
                .to.have.property('timezone')
                .that.is.a('string')
                .to.be.equal('UTC');
            expect(configResult)
                .to.have.property('start')
                .that.is.a('boolean')
                .to.be.equal(true);
        });
    });
});
