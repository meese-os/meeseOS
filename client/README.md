<p align="center">
  <img alt="OS.js Logo" src="https://raw.githubusercontent.com/os-js/gfx/master/logo-big.png" />
</p>

[OS.js](https://www.os-js.org/) is an [open-source](https://raw.githubusercontent.com/os-js/OS.js/master/LICENSE) web desktop platform with a window manager, application APIs, GUI toolkit, filesystem abstractions and much more.

[![Test Coverage](https://api.codeclimate.com/v1/badges/074b81c78fd887a7def5/test_coverage)](https://codeclimate.com/github/os-js/osjs-client/test_coverage)
[![Maintainability](https://api.codeclimate.com/v1/badges/074b81c78fd887a7def5/maintainability)](https://codeclimate.com/github/os-js/osjs-client/maintainability)

# OS.js Client Module

This is the main client core component of OS.js.

Contains base services, virtual filesystem, panels and other core services required for operation.

## Usage

### ESM, Webpack, etc.

```javascript
import { Core /*, ... */ } from '@osjs/client';
```

### UMD

```html
<script src="https://cdn.jsdelivr.net/npm/@osjs/client/dist/main.js"></script>
```

```javascript
const { Core /*, ... */ } = osjsClient;
```
