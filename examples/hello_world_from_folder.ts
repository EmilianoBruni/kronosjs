import Kronos from '@/index.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const cm = await Kronos.create({
    logger: true,
    jobsDir: { base: `${__dirname}/jobs` }
});

process.on('SIGINT', async () => {
    await cm.stop();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    await cm.stop();
    process.exit(0);
});

await cm.start();
