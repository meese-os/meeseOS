<p align="center">
  <img alt="OS.js Logo" src="https://raw.githubusercontent.com/os-js/gfx/master/logo-big.png" />
</p>

[OS.js](https://www.os-js.org/) is an [open-source](https://raw.githubusercontent.com/os-js/OS.js/master/LICENSE) web desktop platform with a window manager, application APIs, GUI toolkit, filesystem abstractions and much more.

[![Support](https://img.shields.io/badge/patreon-support-orange.svg)](https://www.patreon.com/user?u=2978551&ty=h&u=2978551)
[![Support](https://img.shields.io/badge/opencollective-donate-red.svg)](https://opencollective.com/osjs)
[![Donate](https://img.shields.io/badge/liberapay-donate-yellowgreen.svg)](https://liberapay.com/os-js/)
[![Donate](https://img.shields.io/badge/paypal-donate-yellow.svg)](https://paypal.me/andersevenrud)

# OS.js Widgets module

This is the Widgets module for OS.js

* https://manual.os-js.org/v3/install/
* https://manual.os-js.org/v3/guide/provider/
* https://manual.os-js.org/v3/tutorial/widget/

## Installation

First, install the module:

```bash
npm install @osjs/widgets
```

In your client bootstrap (`src/client/index.js`):

```javascript
import {WidgetServiceProvider} from '@aaronmeese.com/widgets';

osjs.register(WidgetServiceProvider);
```

And in your stylesheet (`src/client/index.scss`):

```css
@import "~@aaronmeese.com/widgets/dist/main.css";
```

To set up a default set of widgets in the user settings, modify your client configuration file (`src/client/config.js`):

```javascript
{
  desktop: {
    settings: {
      widgets: [{
        name: 'digitalclock'
      }]
    }
  }
}
```

A contextmenu entry on the desktop is automatically added so users can add these themselves.

## Contribution

* **Sponsor on [Github](https://github.com/sponsors/andersevenrud)**
* **Become a [Patreon](https://www.patreon.com/user?u=2978551&ty=h&u=2978551)**
* **Support on [Open Collective](https://opencollective.com/osjs)**
* [Contribution Guide](https://github.com/os-js/OS.js/blob/master/CONTRIBUTING.md)

## Documentation

See the [Official Manuals](https://manual.os-js.org/) for articles, tutorials and guides.

## Links

* [Official Chat](https://gitter.im/os-js/OS.js)
* [Community Forums and Announcements](https://community.os-js.org/)
* [Homepage](https://os-js.org/)
* [Twitter](https://twitter.com/osjsorg) ([author](https://twitter.com/andersevenrud))
* [Facebook](https://www.facebook.com/os.js.org)
* [Docker Hub](https://hub.docker.com/u/osjs/)
