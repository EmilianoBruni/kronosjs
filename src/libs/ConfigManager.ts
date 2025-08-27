import Conf from 'conf';
import { KCronConfigSchema, type KCronConfig } from '@/types.js';

export class ConfigManager {
    private conf: Conf<Record<string, KCronConfig>>;

    constructor(filePath: string, fileName: string, humanReadable = true) {
        this.conf = new Conf<Record<string, KCronConfig>>({
            configName: fileName.replace(/\.json$/, ''),
            cwd: filePath,
            serialize: value =>
                humanReadable
                    ? JSON.stringify(value, null, 2)
                    : JSON.stringify(value),
            watch: true,
            schema: KCronConfigSchema
        });
    }

    get store(): Record<string, KCronConfig> {
        return this.conf.store;
    }

    set store(config: Record<string, KCronConfig>) {
        this.conf.store = config;
    }

    get(key: string, defaultValue?: KCronConfig): KCronConfig | undefined {
        return defaultValue
            ? this.conf.get(key, defaultValue)
            : this.conf.get(key);
    }

    set(key: string, value: KCronConfig): void;
    set(obj: Record<string, KCronConfig>): void;
    set(
        keyOrObj: string | Record<string, KCronConfig>,
        value?: KCronConfig
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
            newValue?: Readonly<Record<string, KCronConfig>>,
            oldValue?: Readonly<Record<string, KCronConfig>>
        ) => void
    ): void {
        this.conf.onDidAnyChange(callback);
    }
}
