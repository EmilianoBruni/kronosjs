import Kronos from '@/index.js';
import path from 'path';
import { unlinkSync } from 'node:fs';
const cronTabPath = path.join(
            process.cwd(),
            'examples',
            `hello_world-${Date.now()}.crontab`
        );

const cm = await Kronos.create({
    cronTabPath,
    logger: { level: 'info' }
});

cm.add({
    name: 'hello_world',
    cronTime: '* * * * * *',
    onTick: function() {
        this.log && this.log.info('Hello, World!');
        this.stop();
        cm.close();
        unlinkSync(cronTabPath);
    },
    start: true,
});
