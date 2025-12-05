# <img src="assets/kronosjs-logo-64.png" alt="" height="64" width="64"/> kronosjs - Cron Job Manager for Node.js

_Manage, monitor, and control scheduled cron jobs with TypeScript support, hot-reloading, terminal integration and a REST API_

[![npm package](https://img.shields.io/npm/v/@ebruni/kronosjs.svg)](http://npmjs.org/package/@ebruni/kronosjs)
[![Build workflow](https://github.com/EmilianoBruni/kronosjs/actions/workflows/build.yml/badge.svg)](https://github.com/EmilianoBruni/kronosjs/actions/workflows/build.yml)
![Last Commit](https://img.shields.io/github/last-commit/EmilianoBruni/kronosjs)
[![Dependencies](https://img.shields.io/librariesio/github/EmilianoBruni/kronosjs)](https://libraries.io/npm/kronosjs)
![Downloads](https://img.shields.io/npm/dt/@ebruni/kronosjs)

## ✨ Features

### General

-   🧱 **Built on cron**: Uses the battle-tested [cron](https://www.npmjs.com/package/cron) package
-   📁 **Directory-based Jobs**: Load jobs automatically from a directory
-   🔄 **Hot Reload**: Auto-reload job definitions when files change
-   📝 **Crontab Support**: Persist job schedules in a crontab file
-   🖥️ **REST API**: Built-in Fastify HTTP server for job management
-   🛠️ **CLI/Terminal UI**: Manual runs and live status monitoring
-   🪵 **Structured Logging**: Powered by [Pino](https://www.npmjs.com/package/pino) with per-job context
-   ⚡ **TypeScript-first**: Full TypeScript support with comprehensive types
-   🎯 **Timezone Support**: Schedule jobs in any timezone

### 🖥️ Web UI

-   **Dashboard**: Status, next run, last run, duration, failures
-   **Job Detail**: Cron expression, timezone, recent runs, logs
-   **Actions**: Create, start, stop, delete, enable/disable
-   **Logs**: Stream and filter by time, text, status

### 🔄 Hot Reloading & 🧩 Dynamic Jobs

-   Load/unload job definitions at runtime without restarting the server.
-   Watch your job definition files and automatically apply changes.
-   Trigger on-demand runs via API or CLI while the scheduler is active.

### ⌨️ CLI & Terminal Integration

Open the interactive terminal UI by running your project’s CLI entrypoint. Then use:

-   `h`: List all available commands
-   `l`: List all jobs with their status
-   `q`: Quit the program
-   `r #num`: Run the job in the list with the specified number key

Great for quick manual runs, smoke tests, and monitoring during development.

### 💡 Use Cases

-   Operational task scheduling and visibility
-   Admin-friendly controls for background workers
-   CI-triggered job runs and monitoring
-   Rapid iteration with hot-reloaded job definitions

### 🔐 Security

-   API key or JWT auth for UI and API _(recommended in production)_
-   CORS and rate limiting toggles

## 📦 Installation

```bash
npm install @ebruni/kronosjs
# or
pnpm add @ebruni/kronosjs
# or
yarn add @ebruni/kronosjs
```

## 🚀 Quick Start

1. **Install package** and register your handlers
2. **Launch the server** and open the UI at `/` (API under `/api`)
3. **Use the CLI** to run jobs and monitor status from the terminal
4. **Configure storage and auth** via ENV or config file

### Basic Example

```typescript
import Kronos from '@ebruni/kronosjs';

const cm = await Kronos.create({
    logger: true,
    name: 'My Cron Manager'
});

cm.add({
    name: 'hello_world',
    cronTime: '* * * * * *', // every second
    onTick: function () {
        if (this.log) this.log.info('Hello, World!');
    },
    start: true
});
```

### Load Jobs from Directory

Create a job file `jobs/hello_world.job.ts`:

```typescript
import type { KCronConfig, KJob } from '@ebruni/kronosjs';

export default function run(this: KJob) {
    this.log?.info('Hello, World!');
}

export const config: KCronConfig = {
    name: 'hello_world_job',
    timezone: 'UTC',
    schedule: '* * * * * *', // every second
    start: true,
    waitForCompletion: true
};
```

Then load it:

```typescript
import Kronos from '@ebruni/kronosjs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const cm = await Kronos.create({
    logger: true,
    jobsDir: { base: `${__dirname}/jobs` }
});

cm.start();
```

### With HTTP Server

```typescript
import Kronos from '@ebruni/kronosjs';

const cm = await Kronos.create({
    logger: true,
    name: 'My Cron Manager',
    httpServer: { port: 3000, host: '0.0.0.0' }
});

cm.add({
    name: 'hello_world',
    cronTime: '*/2 * * * * *', // every 2 seconds
    onTick: function () {
        if (this.log) this.log.info('Hello, World!');
    },
    start: true
});

// Server automatically started on http://0.0.0.0:3000
```

### Custom Logger Output

```typescript
import Kronos from '@ebruni/kronosjs';

const cm = await Kronos.create({
    logger: {
        stream: {
            write: msg => {
                const msgObj = JSON.parse(msg);
                const msgString = msgObj.jobId
                    ? `[${msgObj.jobId}] ${msgObj.msg}`
                    : msgObj.msg;
                process.stdout.write(msgString + '\n');
            }
        }
    },
    name: 'Custom Logger Example'
});
```

### Complete configuration

```typescript
const devMode = process.env.NODE_ENV !== 'production';

const cm = await Kronos.create({
    // enable logger with different level based on environment
    logger: { level: devMode ? 'debug' : 'info' },
    // specify jobs directory
    jobsDir: { base: `${__dirname}/jobs` },
    // enable cron tab and set path in production
    cronTabPath: devMode ? undefined : `${__dirname}/crontab`,
    // enable terminal integration
    terminal: true,
    // enable HTTP for API access (default port 3000 binding to 0.0.0.0)
    httpServer: true
});
```

## 📖 API Reference

### `Kronos.create(config: KConfig): Promise<Kronos>`

Creates a new Kronos instance with the given configuration.

#### Configuration Options

```typescript
interface KConfig {
    // Optional crontab file path for persistence
    cronTabPath?: string;

    // Directory to load job files from
    jobsDir?: {
        base: string;
        writeable?: boolean; // if false, enables hot-reloading
    };

    // Instance name
    name?: string;

    // Logger configuration
    logger?: boolean | KLogOptions;

    // Custom logger instance
    loggerInstance?: KLog;

    // HTTP server configuration
    httpServer?: {
        port: number;
        host?: string; // defaults to '0.0.0.0'
    };
}
```

### Instance Methods

#### `add(params: KNamedParams | KJob | CronJob): KJob`

Add a new cron job.

```typescript
const job = cm.add({
    name: 'my-job',
    cronTime: '0 */5 * * * *', // every 5 minutes
    timezone: 'America/New_York',
    onTick: function () {
        // Job logic here
        if (this.log) this.log.info('Running job');
    },
    start: true
});
```

#### `job(nameOrIndex: string | number): KJob | undefined`

Get a job by name or index.

```typescript
const job = cm.job('my-job');
const firstJob = cm.job(0);
```

#### `remove(nameOrJob: string | KJob, deleteFromCrontab?: boolean): Promise<void>`

Remove a job.

```typescript
await cm.remove('my-job', true);
```

#### `start(): void`

Start all jobs.

```typescript
cm.start();
```

#### `stop(): void`

Stop all jobs.

```typescript
cm.stop();
```

#### `count(): number`

Get the number of registered jobs.

```typescript
const total = cm.count();
```

#### `close(): Promise<void>`

Stop all jobs and close the Kronos instance (including HTTP server if enabled).

```typescript
await cm.close();
```

#### `reloadAll(): Promise<void>`

Reload all jobs from the directory and crontab.

```typescript
await cm.reloadAll();
```

### Job Object (KJob)

Each job has the following properties and methods:

```typescript
interface KJob extends CronJob {
    name: string;
    log?: KLog; // Pino logger instance
    isActive: boolean;
    isCallbackRunning: boolean;
    cronTime: CronTime;
    lastDate: Date | null;
    nextDate: Date | null;

    start(): void;
    stop(): void;
}
```

---

## 🔄 Hot Reloading

When you set `jobsDir.writeable: false` (or omit it), Kronos watches the directory for changes:

```typescript
const cm = await Kronos.create({
    logger: true,
    jobsDir: {
        base: './jobs',
        writeable: false // enables hot-reloading
    }
});
```

Any changes to `.ts` or `.js` files in the jobs directory will automatically reload all jobs.

## 📝 Crontab Persistence

Save job schedules to a crontab file:

```typescript
const cm = await Kronos.create({
    cronTabPath: './my-crontab.txt',
    jobsDir: { base: './jobs' }
});
```

The crontab file format:

```
* * * * * * job_name_1
0 */5 * * * * job_name_2
```

Changes to the crontab file are automatically detected and applied. Add files to jobDir, change configuration via API or via terminal are applied to crontab file.

## 📊 Logging

Kronos uses [Pino](https://www.npmjs.com/package/pino) for structured logging. Each job gets its own logger context with the `jobId` field.

```typescript
function run(this: KJob) {
    this.log?.info('Starting task');
    this.log?.debug('Debug information');
    this.log?.error('An error occurred');
}
```

## 🌐 HTTP Server

The built-in HTTP server uses [Fastify](https://www.npmjs.com/package/fastify) and can be customized:

```typescript
const cm = await Kronos.create({
    httpServer: { port: 3000, host: 'localhost' }
});

const fastify = cm.httpServer?.getFastifyInstance();

if (fastify) {
    // Add custom routes
    fastify.get('/custom', async () => {
        return { message: 'Custom endpoint' };
    });
}
```

### 🔌 REST API Endpoints

When you enable the HTTP server, the following endpoints are available:

-   `GET /api/jobs` — List all jobs
-   `POST /api/jobs` — Create a job
-   `GET /api/jobs/:id` — Get job details
-   `POST /api/jobs/:id/start` — Start a job
-   `POST /api/jobs/:id/stop` — Stop a job
-   `DELETE /api/jobs/:id` — Delete a job
-   `GET /api/jobs/:id/logs?status=&q=&from=&to=` — Paginated logs

#### Health Check

-   `GET /health` — Server health status

    ```json
    { "status": "ok" }
    ```

#### Job Management

-   `GET /api/jobs` — List all jobs

    ```json
    { "total": 1, "items": ["hello_world"] }
    ```

-   `GET /api/jobs/:jobName` — Get job details

    ```json
    {
        "name": "hello_world",
        "cronTime": "*/2 * * * * *",
        "isActive": true,
        "isRunning": false,
        "lastDate": "2025-01-15T10:30:00.000Z",
        "nextDate": "2025-01-15T10:30:02.000Z"
    }
    ```

-   `POST /api/jobs/:jobName/start` — Start a job

    ```json
    { "result": true, "status": "Job started" }
    ```

-   `POST /api/jobs/:jobName/stop` — Stop a job

    ```json
    { "result": true, "status": "Job stopped" }
    ```

-   `DELETE /api/jobs/:jobName` — Delete a job
    ```json
    { "result": true, "status": "Job removed" }
    ```

## 📚 Examples

Check the [examples](./examples) directory for more use cases:

-   [`hello_world.ts`](./examples/hello_world.ts) - Basic cron job
-   [`hello_world_console_log.ts`](./examples/hello_world_console_log.ts) - Custom logger output
-   [`hello_world_from_folder.ts`](./examples/hello_world_from_folder.ts) - Load jobs from directory
-   [`hello_world_http.ts`](./examples/hello_world_http.ts) - HTTP server integration

## 🧪 Testing

```bash
# Run tests
pnpm test

# Run with coverage
pnpm test:coverage

# Lint code
pnpm lint

# Build
pnpm build
```

## 🔗 Links

-   **Report Bugs**: [GitHub Issues](https://github.com/EmilianoBruni/kronosjs/issues)
-   **Feature Requests**: [GitHub Issues](https://github.com/EmilianoBruni/kronosjs/issues)
-   **Repository**: [GitHub](https://github.com/EmilianoBruni/kronosjs)

## Contributing

We welcome contributions!

## License

Copyright 2024-2025 | Emiliano Bruni
