<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./website/src/client/social_transparent.png">
    <source media="(prefers-color-scheme: light)" srcset="./website/src/client/social.png" width="650">
    <img alt="meeseOS logo" title="meeseOS logo">
  </picture>
</p>
<br />

<p align="center">
  <a href="https://deepsource.io/gh/meese-os/meeseOS/?ref=repository-badge">
    <img
      src="https://deepsource.io/gh/meese-os/meeseOS.svg/?label=active+issues&show_trend=true&token=CRr7brFwKTb7yUJpTlVeUpjA"
      title="Active issues on DeepSource"
      alt="Active issues on DeepSource"
    />
  </a>
  <a href="https://deepsource.io/gh/meese-os/meeseOS/?ref=repository-badge">
    <img
      src="https://deepsource.io/gh/meese-os/meeseOS.svg/?label=resolved+issues&show_trend=true&token=CRr7brFwKTb7yUJpTlVeUpjA"
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

<!-- TODO: Get this working then add to individual subcomponents if possible. -->
<!--
<p align="center">
  <a href="https://codeclimate.com/github/meeseOS/meeseOS/test_coverage">
    <img
      src="https://api.codeclimate.com/v1/badges/074b81c78fd887a7def5/test_coverage"
      title="Test Coverage on Code Climate"
      alt="Test Coverage on Code Climate"
    />
  </a>
  <a href="https://codeclimate.com/github/meeseOS/meeseOS/maintainability">
    <img
      src="https://api.codeclimate.com/v1/badges/074b81c78fd887a7def5/maintainability"
      title="Maintainability on Code Climate"
			alt="Maintainability on Code Climate"
    />
  </a>
</p>
-->

This redesign of my website would not be possible without the _incredible_ work by [Anders Evenrud](https://github.com/andersevenrud) on [OS.js](https://github.com/os-js/OS.js). As you can see in the majority of the files, this monorepo is a modified amalgamation of the OS.js source code.

## Setup

- Run the following commands and update the generated files with your own information:
```sh
cp apps/old-site/.env.template apps/old-site/.env
cp apps/terminal/scripts/.env.template apps/terminal/scripts/.env
cp website/src/client/.env.template website/src/client/.env
cp website/src/server/auth/template.env.json website/src/server/auth/.env.json
```

- Run the following commands to setup the project:
```sh
bash ./scripts/setup.sh
```

## Deploy

- `bash ./scripts/deploy.sh`
  - Can use `--no-reset` for local deployment testing, so you don't lose your changes
- Running `pm2 monit` will allow you to track when the server has finished initializing

For more information, see [this guide](https://manual.os-js.org/guide/deploy/).

## Troubleshooting

If you encounter the error `EADDRINUSE, Address already in use` on Windows, run `taskkill /F /IM node.exe`.

To see if the port is already in use on Linux, run `netstat -tulpn | grep LISTEN`. If you need to free the port, you can likely run `sudo pkill -9 node`. Alternatively, you can run the command `sudo fuser -k 8000/tcp` until there is no output, then the port will be guaranteed to be free.

To see if your process is still runninng, run `pm2 list`.

To monitor the logs from your process, run `pm2 monit`.

## Development

### Actions

To run GitHub Actions locally, do the following:

#### Linux

1. `curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash`
2. `sudo ./bin/act -s GITHUB_TOKEN=ENTER_YOUR_PAT_HERE`
3. Select "Medium" as the image size

#### Windows

1. `winget install nektos.act`
2. Open a new terminal
3. Ensure that Docker Desktop is running
4. `docker pull catthehacker/ubuntu:act-latest`
5. `act --pull=false -s GITHUB_TOKEN=ENTER_YOUR_PAT_HERE`
6. Select "Medium" as the image size

### Building

To build the project, run:

```sh
cd website
rush build
pnpm run deploy
```

Ensure you have properly updated `website/src/server/auth/.env.json` to not include the placeholder comments.

### Testing

To run the test suite, run:

```sh
rush build
rush test
```

### Publishing

To publish changes to MeeseOS, use the following command:

```sh
rush --debug publish --publish --include-all --set-access-level public
```

You can specify which registry you want to publish by adding one of the following flags:

- GitHub Packages: `--registry https://npm.pkg.github.com`
- NPM: `--registry https://registry.npmjs.org`

If you want to do a dry run first, run `rush publish --include-all`. You will have to set your environmental variables based on the repository you are publishing to, either `NPM_AUTH_TOKEN` or `GH_AUTH_TOKEN`.

## Build cache

This repository is configured to take advantage of Rush's build cache. Each package defines a `config/rush-project.json` file so that `rush build --verbose` can reuse cached output when available while intentionally skipping caching for tooling packages that do not emit build artifacts.
