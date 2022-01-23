# aaronmeese.com

## Installation
You can also install this directly onto your system by using the following set of commands.

> **NOTE:** Requires Node v12 (or later).

```bash
# Install dependencies
npm install

# It's recommended that you update dependencies
npm update

# Optionally install extra packages:
# For a list of packages, see https://manual.os-js.org/resource/official/

# Discover installed packages
npm run package:discover

# Build client
npm run build

# Start serving
npm run serve
```

## Upgrade
You can list outdated packages with `npm outdated`.

To upgrade, use `npm update`.

It is also recommended that you run `npm run package:discover` afterwards.

> Releases uses [semantic versioning](https://semver.org/) so if an update has breaking changes the `npm update` command will not upgrade to the latest release. You'll have to do it manually by using `npm install <package>@^<version>`. **Make sure to read the [migration guide](https://manual.os-js.org/guide/migrate/) before you update for any special notices.**

## Remove Packages
Depending on how you installed your package(s), this is the procedure:

1. `npm remove packagename` or `rm -rf src/packages/PackageName`
2. `npm run package:discover`

You can also disable packages.

## SEE MORE [HERE](https://manual.os-js.org/)

## Deployment
For deploying to production, see [this guide](https://manual.os-js.org/guide/deploy/).