import Kronos from '@/index.js';

const cm = await Kronos.create({
    logger: { level: 'info' },
    name: 'Hello World example'
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
