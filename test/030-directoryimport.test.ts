import { expect } from 'chai';

import { fileURLToPath } from 'node:url';
import { writeFileSync, unlinkSync, appendFileSync } from 'node:fs';
import { dirname } from 'node:path';
import DirectoryImport from '../src/libs/DirectoryImport.js';

// get current working directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dirImport = new DirectoryImport({
    path: `${__dirname}/jobs`,
    log: (...args) => console.log(...args) // eslint-disable-line no-console
});
const modules = dirImport.modules();
// await dirImport.init();

describe('DirectoryImport', () => {
    after(() => {
        dirImport.close();
    });

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
                .to.be.equal('* 1 * * * *');
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

    describe('Alter files in the directory', () => {
        it('should emit change event when a file is added', () => {
            const changed = new Promise(resolve =>
                dirImport.on('change', resolve)
            );
            // add a new file to the directory
            // touch test/jobs/newfile.ts
            writeFileSync(`${__dirname}/jobs/newfile.ts`, '// new file');
            return changed;
        });

        it('should emit change event when a file is changed', () => {
            const altered = new Promise(resolve =>
                dirImport.on('change', resolve)
            );
            // change a file in the directory
            // echo '// changed' >> test/jobs/newfile.ts
            appendFileSync(`${__dirname}/jobs/newfile.ts`, '// changed');
            return altered;
        });

        it('should emit change event when a file is removed', () => {
            const removed = new Promise(resolve =>
                dirImport.on('change', resolve)
            );
            // remove a file from the directory
            // rm test/jobs/newfile.ts
            unlinkSync(`${__dirname}/jobs/newfile.ts`);
            return removed;
        });
    });
});
