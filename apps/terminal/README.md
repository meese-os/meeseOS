<p align="center">
  <img alt="OS.js Logo" src="https://raw.githubusercontent.com/os-js/gfx/master/logo-big.png" />
</p>

[OS.js](https://www.os-js.org/) is an [open-source](https://raw.githubusercontent.com/os-js/OS.js/master/LICENSE) web desktop platform with a window manager, application APIs, GUI toolkit, filesystem abstractions and much more.

# OS.js v3 Xterm Application

This is the Xterm Application for OS.js v3

![Screenshot](https://raw.githubusercontent.com/os-js/osjs-xterm-application/master/screenshot.png)

## Requirements

* `bash`
* `ssh`

## Installation

```bash
npm install --save --production @osjs/xterm-application
npm run package:discover
```

# Usage

Start from application menu.

**Note that it will log into a shell with the username you are logged in as.**

If you want to change this behavior, you can add this to your `src/server/config.js` file in the OS.js distribution:

```javascript
module.exports = {
  // ... append this to your export ...
  xterm: {
    // You can also set this as a string to force a username
    login: false
  }
}
```

You can also change the connection arguments:

```javascript
module.exports = {
  // ... append this to your export ...
  xterm: {
    ssh: {
      // Custom hostname
      hostname: 'localhost',

      // Custom port
      args: '-p 1022'
    }
  }
}
```
