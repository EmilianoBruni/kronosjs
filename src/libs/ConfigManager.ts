import Conf from 'conf';
import { CJCronConfigSchema, type CJCronConfig } from '@/types.js';

export class ConfigManager {
    private conf: Conf<Record<string, CJCronConfig>>;

    constructor(filePath: string, fileName: string, humanReadable = true) {
        this.conf = new Conf<Record<string, CJCronConfig>>({
            configName: fileName.replace(/\.json$/, ''),
            cwd: filePath,
            serialize: value =>
                humanReadable
                    ? JSON.stringify(value, null, 2)
                    : JSON.stringify(value),
            watch: true,
            schema: CJCronConfigSchema
        });
    }

    get store(): Record<string, CJCronConfig> {
        return this.conf.store;
    }

    set store(config: Record<string, CJCronConfig>) {
        this.conf.store = config;
    }

    get(key: string, defaultValue?: CJCronConfig): CJCronConfig | undefined {
        return defaultValue
            ? this.conf.get(key, defaultValue)
            : this.conf.get(key);
    }

    set(key: string, value: CJCronConfig): void;
    set(obj: Record<string, CJCronConfig>): void;
    set(
        keyOrObj: string | Record<string, CJCronConfig>,
        value?: CJCronConfig
    ): void {
        if (typeof keyOrObj === 'string' && value !== undefined) {
            this.conf.set(keyOrObj, value);
        } else if (typeof keyOrObj === 'object') {
            this.conf.set(keyOrObj);
        }
    }

    // mergeConfig(json: Record<string, CJCronConfig>) {
    //     const merged = { ...this.conf.store, ...json };
    //     this.conf.store = merged;
    //     this.notifyListeners();
    // }

    reset(): void {
        this.conf.clear();
    }

    has(key: string): boolean {
        return this.conf.has(key);
    }

    delete(key: string): void {
        this.conf.delete(key);
    }

    clear(): void {
        this.conf.clear();
    }

    get size(): number {
        return Object.keys(this.conf.store).length;
    }

    get path(): string {
        return this.conf.path;
    }

    onDidAnyChange(
        callback: (
            newValue?: Readonly<Record<string, CJCronConfig>>,
            oldValue?: Readonly<Record<string, CJCronConfig>>
        ) => void
    ): void {
        this.conf.onDidAnyChange(callback);
    }
}
