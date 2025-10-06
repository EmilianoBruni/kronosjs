import Kronos from '@/index.js';

const cm = await Kronos.create({
    logger: true,
    name: 'Hello World example',
    httpServer: { port: 3000 } // enable http server on port 3000
});

cm.add({
    name: 'hello_world',
    cronTime: '*/2 * * * * *',
    onTick: function () {
        if (this.log) this.log.info('Hello, World!');
        // cm.close(); // stop all jobs too
    },
    start: true
});

const fastify = cm.httpServer?.getFastifyInstance();

if (!fastify) {
    throw new Error('Fastify instance not available');
}

fastify.inject(
    {
        method: 'GET',
        url: '/health'
    },
    (err, res) => {
        if (err) {
            console.error(err);
            return;
        }
        process.stdout.write(
            'Response: ' + JSON.stringify(res?.payload) + '\n'
        ); // should print: { status: 'ok' }
    }
);

fastify.inject(
    {
        method: 'GET',
        url: '/api/jobs'
    },
    (err, res) => {
        if (err) {
            console.error(err);
            return;
        }
        process.stdout.write(
            'Response: ' + JSON.stringify(res?.payload) + '\n'
        ); // should print: { total: 1, items: [ 'hello_world' ] }
    }
);

await cm.close();
