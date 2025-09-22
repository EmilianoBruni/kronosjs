import { KCronJob, KLog } from '@/types.js';
import { directoryImport } from 'directory-import';
import { EventEmitter } from 'node:events';
import chokidar, { type FSWatcher } from 'chokidar';

type DirectoryImportOptions = {
    path: string;
    log?: KLog;
};

type ModuleInfo = {
    moduleName: string;
    modulePath: string;
    moduleData: KCronJob;
};

class DirectoryImport extends EventEmitter {
    private _path: string = '';
    private log?: KLog;
    #watcher: FSWatcher;

    public static async create(opts: DirectoryImportOptions) {
        const dI = new DirectoryImport(opts);
        await dI.#waitForWatcherToBeReady();
        return dI;
    }

    constructor(opts: DirectoryImportOptions) {
        super();
        this._path = opts.path;
        this.log = opts.log;
        // whatch for changes in the directory emit event to Kronos for reloading jobs
        this.#watcher = chokidar.watch(this._path, {
            ignoreInitial: true,
            persistent: true
        });
    }

    async #waitForWatcherToBeReady() {
        return await new Promise(resolve => {
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
                resolve(true);
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
            this.log?.error(
                { error: (error as Error).message },
                'Error while importing jobs'
            );
        }

        return ret;
    }

    async close() {
        await this.#watcher.close();
    }
}

export default DirectoryImport;
