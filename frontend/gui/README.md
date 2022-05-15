# MeeseOS GUI Module

This is the main client GUI component module of MeeseOS.

Contains all components and adapters for the default UIs.

## Development

This package has two build targets: `UMD` and `ES`.

UMD is built with Webpack via `npm run build` (or `npm run watch`), and ES via `npm run build:esm` (or `npm run watch:esm`).

The MeeseOS distribution uses the UMD build to load _stylesheets_, and everything else uses ES modules to load components, service providers etc.

So effectively you need to run both in order for this to work while developing.

_The UMD javascript bundle is currently only used for environments like Codepen._
