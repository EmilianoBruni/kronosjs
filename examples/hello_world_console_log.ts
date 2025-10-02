import Kronos from '@/index.js';

const cm = await Kronos.create({
    logger: {
        stream: {
            write: msg => process.stdout.write(JSON.parse(msg).msg + '\n')
        }
    },
    name: 'Hello World via console example'
});

cm.add({
    name: 'hello_world',
    cronTime: '* * * * * *',
    onTick: function () {
        if (this.log) this.log.info('Hello, World!');
        cm.close(); // stop all jobs too
    },
    start: true
});
