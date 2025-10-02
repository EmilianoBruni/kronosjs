import Kronos from '@/index.js';

const cm = await Kronos.create({
    logger: { level: 'info' }
});

cm.add({
    name: 'hello_world',
    cronTime: '* * * * * *',
    onTick: function() {
        this.log && this.log.info('Hello, World!');
        this.stop();
        cm.close();
    },
    start: true,
});
