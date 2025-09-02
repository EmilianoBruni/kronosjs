import fs from 'fs';
import { EventEmitter } from 'events';
import path from 'path';
import chokidar, { type FSWatcher } from 'chokidar';

type ChangeCallback = (
    newMap: ReadonlyMap<string, string>,
    oldMap: ReadonlyMap<string, string>
) => void;

async function Crontab(crontabPath: string) {
    const m = new Map<string, string>();
    const emitter = new EventEmitter();
    let writing = false;
    let watcher: FSWatcher;

    // helpers
    const parse = (content: string) => {
        const mp = new Map<string, string>();
        const lines = content.split(/\r?\n/);
        for (let line of lines) {
            line = line.trim();
            if (!line) continue;
            if (line.startsWith('#')) continue;
            const parts = line.split(/\s+/);
            if (parts.length < 2) continue;
            const jobName = parts[parts.length - 1];
            const cron = parts.slice(0, parts.length - 1).join(' ');
            mp.set(jobName, cron);
        }
        return mp;
    };

    const serialize = (map: Map<string, string>) => {
        const lines: string[] = [];
        for (const [jobName, cron] of map.entries()) {
            lines.push(`${cron} ${jobName}`);
        }
        return lines.join('\n') + (lines.length ? '\n' : '');
    };

    const mapsEqual = (a: Map<string, string>, b: Map<string, string>) => {
        if (a.size !== b.size) return false;
        for (const [k, v] of a.entries()) {
            if (!b.has(k)) return false;
            if (b.get(k) !== v) return false;
        }
        return true;
    };

    const writeToFile = () => {
        const data = serialize(m);
        writing = true;
        try {
            fs.writeFileSync(crontabPath, data, { encoding: 'utf-8' });
        } finally {
            // small delay not strictly necessary for sync write, but keep pattern
            writing = false;
        }
    };

    const reloadFromFile = () => {
        try {
            const content = fs.readFileSync(crontabPath, { encoding: 'utf-8' });
            const newMap = parse(content);
            if (!mapsEqual(m, newMap)) {
                const old = new Map(m);
                m.clear();
                for (const [k, v] of newMap.entries()) m.set(k, v);
                emitter.emit('change', new Map(m), old);
            }
        } catch {
            // ignore
        }
    };

    const startWatcher = async () => {
        await new Promise<FSWatcher>(resolve => {
            watcher = chokidar.watch(crontabPath).on('ready', () => {
                resolve(watcher);
            });
        }).then(watcher => {
            watcher.on('change', () => {
                if (writing) return;
                reloadFromFile();
            });
        });
    };

    // initialize
    try {
        const dir = path.dirname(crontabPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    } catch {
        // ignore
    }

    try {
        if (!fs.existsSync(crontabPath))
            fs.writeFileSync(crontabPath, '', { encoding: 'utf-8' });
        const content = fs.readFileSync(crontabPath, { encoding: 'utf-8' });
        const parsed = parse(content);
        m.clear();
        for (const [k, v] of parsed.entries()) m.set(k, v);
    } catch {
        m.clear();
    }

    await startWatcher();

    // augment mutating methods to persist
    (m as Map<string, string>).set = function (key: string, value: string) {
        Map.prototype.set.call(m, key, value);
        writeToFile();
        return m;
    };

    (m as Map<string, string>).delete = function (key: string) {
        const existed = m.has(key);
        const res = Map.prototype.delete.call(m, key);
        if (existed) writeToFile();
        return res;
    };

    (m as Map<string, string>).clear = function () {
        const hadAny = m.size > 0;
        Map.prototype.clear.call(m);
        if (hadAny) writeToFile();
    };

    // attach utility methods
    Object.defineProperty(m, 'onDidChange', {
        value: (cb: ChangeCallback) => emitter.on('change', cb),
        enumerable: false
    });
    Object.defineProperty(m, 'offDidChange', {
        value: (cb: ChangeCallback) => emitter.off('change', cb),
        enumerable: false
    });
    Object.defineProperty(m, 'close', {
        value: async () => {
            if (watcher) await watcher.close();
            emitter.removeAllListeners();
        },
        enumerable: false
    });

    return m as Map<string, string> & {
        onDidChange(cb: ChangeCallback): void;
        offDidChange(cb: ChangeCallback): void;
        close(): Promise<void>;
    };
}

export default Crontab;
