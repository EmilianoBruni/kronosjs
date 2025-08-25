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
        expect(modules).to.have.lengthOf(1);
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

    it('should correctly import and instantiate the job', async () => {
        const moduleInfo = modules[0];
        // instantiate the job
        const job = (<{ default: () => Promise<void> }>moduleInfo.moduleData)
            .default;
        expect(job).to.be.a('function');
        expect(await job()).to.equal(true);
    });
});
