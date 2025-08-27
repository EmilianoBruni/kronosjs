# 🚦 kronosjsJS - Cron Manager for Node.js

_Manage, monitor, and control scheduled cron jobs with terminal integration and a simple REST API_

[![npm package](https://img.shields.io/npm/v/kronosjs.svg)](http://npmjs.org/package/kronosjs)
[![Build workflow](https://github.com/EmilianoBruni/kronosjs/actions/workflows/build.yml/badge.svg)](https://github.com/EmilianoBruni/kronosjs/actions/workflows/build.yml)
[![Coverage Status](https://coveralls.io/repos/github/EmilianoBruni/kronosjs/badge.svg?branch=master)](https://coveralls.io/github/EmilianoBruni/kronosjs?branch=master)
![Last Commit](https://img.shields.io/github/last-commit/EmilianoBruni/kronosjs)
[![Dependencies](https://img.shields.io/librariesio/github/EmilianoBruni/kronosjs)](https://libraries.io/npm/kronosjs)
![Downloads](https://img.shields.io/npm/dt/kronosjs)

## ✨ Features

- 🧱 **Built on cron**: Uses the standard [cron](https://www.npmjs.com/package/cron) package for scheduling core 
- 🖥️ **REST API**: List jobs, view details, create/edit, start/stop, and see run logs. Automate and integrate with CI/CD
- ⏰ **Cron Expressions**: Timezone & concurrency controls
- 🔄 **Hot Reload**: Auto-reload job definitions on change
- 🧩 **Dynamic Jobs**: Load, run, and manage jobs at runtime
- 🛠️ **CLI/Terminal UI**: Manual runs and live status monitoring
- 📜 **Live Logs**: Filter by status, date, and text
- 💾 **Optional Persistence**: In-memory or database adapter
- ⚡ **TypeScript-first**: Framework-agnostic HTTP server (Express-compatible)
- 🔒 **Auth**: API key or JWT (optional)

---

## 🔌 REST API Endpoints

- `GET /api/crons` — List all jobs
- `POST /api/crons` — Create a job
- `GET /api/crons/:id` — Get job details
- `POST /api/crons/:id/start` — Start a job
- `POST /api/crons/:id/stop` — Stop a job
- `DELETE /api/crons/:id` — Delete a job
- `GET /api/crons/:id/logs?status=&q=&from=&to=` — Paginated logs

**Example job payload:**
```json
{
  "name": "daily-report",
  "schedule": "0 7 * * *",
  "timezone": "UTC",
  "concurrency": 1,
  "enabled": true,
  "handler": "report:daily"
}
```
*(Maps to your registered function)*

---

## 🖥️ Web UI

- **Dashboard**: Status, next run, last run, duration, failures
- **Job Detail**: Cron expression, timezone, recent runs, logs
- **Actions**: Create, start, stop, delete, enable/disable
- **Logs**: Stream and filter by time, text, status

---

## 🔄 Hot Reloading & 🧩 Dynamic Jobs

- Load/unload job definitions at runtime without restarting the server.
- Watch your job definition files and automatically apply changes.
- Trigger on-demand runs via API or CLI while the scheduler is active.

---

## ⌨️ CLI & Terminal Integration

Open the interactive terminal UI by running your project’s CLI entrypoint. Then use:

- `h`: List all available commands
- `l`: List all jobs with their status
- `q`: Quit the program
- `r #num`: Run the job in the list with the specified number key

Great for quick manual runs, smoke tests, and monitoring during development.

---

## 🚀 Quick Start

1. **Install package** and register your handlers
2. **Launch the server** and open the UI at `/` (API under `/api`)
3. **Use the CLI** to run jobs and monitor status from the terminal
4. **Configure storage and auth** via ENV or config file

---

## 💡 Use Cases

- Operational task scheduling and visibility
- Admin-friendly controls for background workers
- CI-triggered job runs and monitoring
- Rapid iteration with hot-reloaded job definitions

---

## 🔐 Security

- API key or JWT auth for UI and API *(recommended in production)*
- CORS and rate limiting toggles

## Links

- **Report Bugs**: [GitHub Issues](https://github.com/EmilianoBruni/kronosjs/issues)
- **Feature Requests**: [GitHub Issues](https://github.com/EmilianoBruni/kronosjs/issues)
- **Help and Support**: [GitHub Discussions](https://github.com/EmilianoBruni/kronosjs)

## Contributing

We welcome contributions!

## License

Copyright 2024-2025 | Emiliano Bruni