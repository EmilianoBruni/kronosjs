import { expect } from 'chai';
import Kronos from '../src/index.js';
import path from 'path';
import { unlinkSync } from 'fs';
import LoggerCreate from '../src/libs/Logger.js';
import pino from 'pino';
import { Transform } from 'stream';

describe('Log instance', () => {
    it('use an abstract log if logger is missing', async () => {
        const log = LoggerCreate({});
        // expect log.info to not produce log messages
        expect(log).to.have.property('info');
        expect(log.info).to.be.a('function');
        // expect log.child to return the same null logger
        const childLog = log.child({ foo: 'bar' });
        expect(childLog).to.equal(log);
        log.info('This is a test message');
    });

    it('use a pino log if logger options are provided', async () => {
        const stream = jsonStream();
        const log = LoggerCreate({ logger: { level: 'info', stream } });
        expect(log).to.have.property('info');
        expect(log.info).to.be.a('function');
        const childLog = log.child({ foo: 'bar' });
        expect(childLog).to.not.equal(log);
        childLog.info('This is a test message');
        const logged = stream.lastJSON();
        expect(logged).to.have.property('level', 'info');
        expect(logged).to.have.property('msg', 'This is a test message');
        expect(logged).to.have.property('foo', 'bar');
    });

    it('use the provided pino instance if loggerInstance is provided', async () => {
        const stream = jsonStream();
        const pinoInstance = pino({ level: 'info' }, stream);
        const log = LoggerCreate({ loggerInstance: pinoInstance });
        expect(log).to.have.property('info');
        expect(log.info).to.be.a('function');
        const childLog = log.child({ foo: 'bar' });
        expect(childLog).to.not.equal(log);
        childLog.info('This is a test message');
        const logged = stream.lastJSON();
        expect(logged).to.have.property('level', 30);
        expect(logged).to.have.property('msg', 'This is a test message');
        expect(logged).to.have.property('foo', 'bar');
    });
});

describe('CronManager log functionality', () => {
    it('logs expected messages on loop', async () => {
        const stream = jsonStream();
        const cronTabPath = path.join(
            process.cwd(),
            'test',
            `020-crontab-${Date.now()}.txt`
        );
        const cm = await Kronos.create({
            cronTabPath,
            logger: { level: 'info', stream }
        });

        await cm.loop();
        let logged = stream.lastJSON();
        expect(logged).to.have.property('level', 'info');
        expect(logged).to.have.property('msg', 'Cron started');

        await cm.close();
        logged = stream.lastJSON();
        expect(logged).to.have.property('level', 'info');
        expect(logged).to.have.property(
            'msg',
            `${cm.config.name} shutting down...`
        );

        unlinkSync(cronTabPath);
    });
});

function jsonStream(opts = {}) {
    let last = '';

    const t = new Transform({
        ...opts,
        readableObjectMode: false,
        writableObjectMode: false,
        transform(chunk, encoding, callback) {
            // normalize chunk to string
            const str = Buffer.isBuffer(chunk)
                ? chunk.toString('utf8')
                : String(chunk);
            last = str;
            // don't emit anything yet; only emit the latest on flush/read
            callback();
        },
        flush(callback) {
            if (last !== '') {
                this.push(last);
            }
            callback();
        }
    }) as Transform & { lastJSON: () => object };

    // helper to get latest write without waiting for stream end
    t.lastJSON = () => JSON.parse(last);

    return t;
}
