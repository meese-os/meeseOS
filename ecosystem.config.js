const path = require("path");

// Resolve paths relative to this config file's location
const repoRoot = __dirname;
const websiteDir = path.join(repoRoot, "website");
const logsDir = path.join(repoRoot, "logs");

module.exports = {
	apps: [
		{
			name: "meeseos",
			script: "/bin/bash",
			args: ["-c", `cd "${websiteDir}" && pnpm run deploy`],
			cwd: websiteDir,
			instances: 1,
			exec_mode: "fork",
			autorestart: true,
			watch: false,
			max_memory_restart: "1G",
			error_file: path.join(logsDir, "pm2-error.log"),
			out_file: path.join(logsDir, "pm2-out.log"),
			log_date_format: "YYYY-MM-DD HH:mm:ss Z",
			merge_logs: true,
			env: {
				NODE_ENV: "production"
			}
		}
	]
};
