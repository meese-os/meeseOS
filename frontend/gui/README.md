<p align="center">
  <img alt="OS.js Logo" src="https://raw.githubusercontent.com/os-js/gfx/master/logo-big.png" />
</p>

[OS.js](https://www.os-js.org/) is an [open-source](https://raw.githubusercontent.com/os-js/OS.js/master/LICENSE) web desktop platform with a window manager, application APIs, GUI toolkit, filesystem abstractions and much more.

# OS.js GUI Module

This is the main client GUI component module of OS.js.

Contains all components and adapters for the default UIs.

## Development

This package has two build targets: `UMD` and `ES`.

UMD is built with Webpack via `npm run build` (or `npm run watch`), and ES via `npm run build:esm` (or `npm run watch:esm`).

The OS.js distribution uses the UMD build to load _stylesheets_, and everything else uses ES modules to load components, service providers etc.

So effectively you need to run both in order for this to work while developing.

_The UMD javascript bundle is currently only used for environments like Codepen._
