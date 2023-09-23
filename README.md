<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./website/src/client/social_transparent.png">
    <source media="(prefers-color-scheme: light)" srcset="./website/src/client/social.png" width="650">
    <img alt="meeseOS logo" title="meeseOS logo">
  </picture>
</p>
<br />

<p align="center">
  <a href="https://deepsource.io/gh/meeseOS/meeseOS/?ref=repository-badge">
    <img
      src="https://deepsource.io/gh/meeseOS/meeseOS.svg/?label=active+issues&show_trend=true&token=CRr7brFwKTb7yUJpTlVeUpjA"
      title="Active issues on DeepSource"
      alt="Active issues on DeepSource"
    />
  </a>
  <a href="https://deepsource.io/gh/meeseOS/meeseOS/?ref=repository-badge">
    <img
      src="https://deepsource.io/gh/meeseOS/meeseOS.svg/?label=resolved+issues&show_trend=true&token=CRr7brFwKTb7yUJpTlVeUpjA"
      title="Resolved issues on DeepSource"
			alt="Resolved issues on DeepSource"
    />
  </a>
	<a href="https://gitter.im/meeseOS/community?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge">
		<img
			src="https://badges.gitter.im/meeseOS/community.svg"
			title="Gitter"
			alt="Gitter"
		/>
	</a>
</p>

<p align="center">
  <a href="https://codeclimate.com/github/meeseOS/meese-cli/test_coverage">
    <img
      src="https://api.codeclimate.com/v1/badges/074b81c78fd887a7def5/test_coverage"
      title="Test Coverage on Code Climate"
      alt="Test Coverage on Code Climate"
    />
  </a>
  <!--<a href="https://codeclimate.com/github/os-js/meese-cli/maintainability">
    <img
      src="https://api.codeclimate.com/v1/badges/074b81c78fd887a7def5/maintainability"
      title="Maintainability on Code Climate"
			alt="Maintainability on Code Climate"
    />
  </a>-->
</p>

This redesign of my website would not be possible without the _incredible_ work by [Anders Evenrud](https://github.com/andersevenrud) on [OS.js](https://github.com/os-js/OS.js). As you can see in the majority of the files, this monorepo is a modified amalgamation of the OS.js source code.

## Setup

- Run the following commands and update the generated files with your own information:
	- `cp apps/old-site/.env.template apps/old-site/.env`
	- `cp apps/terminal/scripts/.env.template apps/terminal/scripts/.env`
	- `cp website/src/client/.env.template website/src/client/.env`
	- `cp website/src/server/auth/template.env.json website/src/server/auth/.env.json`
- `bash ./setup.sh`

## Deploy

- `bash ./deploy.sh`
  - Can use `--no-reset` for local deployment testing, so you don't lose your changes
- Running `pm2 monit` will allow you to track when the server has finished initializing

For more information, see [this guide](https://manual.os-js.org/guide/deploy/).

## Troubleshooting

If you encounter the error `EADDRINUSE, Address already in use` on Windows, run `taskkill /F /IM node.exe`.

To see if the port is already in use on Linux, run `netstat -tulpn | grep LISTEN`. If you need to free the port, you can likely run `sudo pkill -9 node`. Alternatively, you can run the command `sudo fuser -k 8000/tcp` until there is no output, then the port will be guaranteed to be free.

To see if your process is still runninng, run `pm2 list`.

To monitor the logs from your process, run `pm2 monit`.

## Development

To run GitHub Actions locally, do the following:

1. `curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash`
2. `sudo ./bin/act -s GITHUB_TOKEN=ENTER_YOUR_PAT_HERE`
3. Select "Medium" as the image size

## Development

To publish changes to the GitHub and NPM registries, run `cd website && pnpm run publish`.

If you want to do a dry run first, run `cd website && pnpm run publish:dry`.

# TODO

- Caching for "rush-project.json"
  - "Project does not have a rush-project.json configuration file, or one provided by a rig, so it does not support caching."
  - "rush build --verbose"
- Fix the xterm problem
  - Prevent "WebSocket is already in CLOSING or CLOSED state" error when closing terminal
