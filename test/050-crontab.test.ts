import { expect } from 'chai';
import path from 'path';
// import fs from 'fs';
import fs from 'fs';
import Crontab from '@/libs/Crontab.js';

// const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

describe('Crontab', () => {
    const tmpFiles: string[] = [];

    afterEach(() => {
        for (const f of tmpFiles) {
            try {
                fs.unlinkSync(f);
            } catch {
                // ignore
            }
        }
        tmpFiles.length = 0;
    });

    it('creates file on construct', async () => {
        const file = path.join(
            process.cwd(),
            'test',
            `crontab-${Date.now()}.txt`
        );
        tmpFiles.push(file);

        const c = await Crontab(file);

        try {
            const content = fs.readFileSync(file, { encoding: 'utf-8' });
            expect(content).to.equal('');
        } finally {
            await c.close();
        }
    });

    it('constructs and persists map.set to file', async () => {
        const file = path.join(
            process.cwd(),
            'test',
            `crontab-${Date.now()}.txt`
        );
        tmpFiles.push(file);

        const c = await Crontab(file);

        try {
            // set a job via the Map instance
            c.set('job1', '* * * * * *');

            // allow write debounce and fs events
            // await wait(250);

            const content = fs.readFileSync(file, { encoding: 'utf-8' });
            expect(content.trim()).to.equal('* * * * * * job1');
        } finally {
            await c.close();
        }
    }).timeout(5000);

    it('reloads when file externally changed and emits onchange', async () => {
        const file = path.join(
            process.cwd(),
            'test',
            `crontab-${Date.now()}.txt`
        );
        tmpFiles.push(file);

        const c = await Crontab(file);

        await new Promise<void>(resolve => {
            c.onDidChange((newMap: ReadonlyMap<string, string>) => {
                expect(newMap.get('externalJob')).to.equal('* * * * * *');
                c.close().then(() => resolve());
            });
            fs.writeFileSync(file, '* * * * * * externalJob\n', {
                encoding: 'utf-8'
            });
        });
    }).timeout(5000);

    it('delete and clear update the file', async () => {
        const file = path.join(
            process.cwd(),
            'test',
            `crontab-${Date.now()}.txt`
        );
        tmpFiles.push(file);

        const c = await Crontab(file);

        try {
            c.set('a', '* * * * * *');
            c.set('b', '0 0 * * * *');
            // await wait(250);

            let content = fs
                .readFileSync(file, 'utf-8')
                .trim()
                .split(/\r?\n/)
                .filter(Boolean);
            expect(content).to.have.lengthOf(2);

            c.delete('a');
            // await wait(250);
            content = fs
                .readFileSync(file, 'utf-8')
                .trim()
                .split(/\r?\n/)
                .filter(Boolean);
            expect(content).to.have.lengthOf(1);
            expect(content[0].endsWith('b')).to.equal(true);

            c.clear();
            // await wait(250)
            const after = fs.readFileSync(file, 'utf-8');
            expect(after.trim()).to.equal('');
        } finally {
            await c.close();
        }
    }).timeout(5000);
});
