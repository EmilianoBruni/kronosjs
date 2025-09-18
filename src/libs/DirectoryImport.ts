import { KCronJob } from '@/types.js';
import { directoryImport } from 'directory-import';
import { EventEmitter } from 'node:events';
import chokidar, { type FSWatcher } from 'chokidar';

type DirectoryImportOptions = {
    path: string;
    log?: (...args: unknown[]) => void;
};

type ModuleInfo = {
    moduleName: string;
    modulePath: string;
    moduleData: KCronJob;
};

class DirectoryImport extends EventEmitter {
    private _path: string = '';
    private _log?: (...args: unknown[]) => void;
    #watcher: FSWatcher;

    constructor(opts: DirectoryImportOptions) {
        super();
        this._path = opts.path;
        this._log = opts.log;
        // whatch for changes in the directory emit event to Kronos for reloading jobs
        this.#watcher = chokidar.watch(this._path, {
            ignoreInitial: true,
            persistent: true
        });
        this.#watcher.on('ready', () => {
            this.#watcher
                .on('change', () => {
                    this.emit('change');
                })
                .on('add', () => {
                    this.emit('change');
                })
                .on('unlink', () => {
                    this.emit('change');
                });
        });
    }

    public modules() {
        // Logic to import all files from the directory
        const ret: ModuleInfo[] = [];

        try {
            directoryImport(
                {
                    targetDirectoryPath: this._path,
                    forceReload: true
                },
                (moduleName, modulePath, moduleData) => {
                    ret.push({
                        moduleName,
                        modulePath,
                        moduleData: moduleData as KCronJob
                    });
                }
            );
        } catch (error) {
            this.log('Error while importing jobs:', (error as Error).message);
        }

        return ret;
    }

    async close() {
        await this.#watcher.close();
    }

    private log(...args: unknown[]) {
        if (!this._log) return;
        this._log(...args);
    }
}

export default DirectoryImport;
