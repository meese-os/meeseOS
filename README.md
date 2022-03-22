# aaronmeese.com

This redesign of my website would not be possible without the _incredible_ work by [Anders Evenrud](https://github.com/andersevenrud) on [OS.js](https://github.com/os-js/OS.js). As you can see in the majority of the files, this monorepo is a modified amalgamation of the OS.js source code.

## Setup

1. `nvm install`
2. `nvm use`

## Troubleshooting

If you encounter the error `EADDRINUSE, Address already in use`, run the following command:

`taskkill /F /IM node.exe`

## TODOs

- Pinpoint why the GUI occasionally refuses to initialize when testing so I can raise an issue on the OS.js repo
