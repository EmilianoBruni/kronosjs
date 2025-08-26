import { CJCronJob } from '@/types.js';
import { directoryImport } from 'directory-import';

type DirectoryImportOptions = {
    path: string;
    log?: (...args: unknown[]) => void;
};

type ModuleInfo = {
    moduleName: string;
    modulePath: string;
    moduleData: CJCronJob;
};

class DirectoryImport {
    private _path: string = '';
    private _log?: (...args: unknown[]) => void;

    constructor(opts: DirectoryImportOptions) {
        this._path = opts.path;
        this._log = opts.log;
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
                        moduleData: moduleData as CJCronJob
                    });
                }
            );
        } catch (error) {
            this.log('Error while importing jobs:', (error as Error).message);
        }

        return ret;
    }

    private log(...args: unknown[]) {
        if (!this._log) return;
        this._log(...args);
    }
}

export default DirectoryImport;
