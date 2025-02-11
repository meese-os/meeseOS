# MeeseOS Xterm Application

This is the Xterm Application for MeeseOS

![Screenshot](https://raw.githubusercontent.com/os-js/osjs-xterm-application/master/screenshot.png)

## Requirements

- `bash`
- `ssh`

# Usage

Start from application menu.

**Note that it will log into a shell with the username you are logged in as.**

If you want to change this behavior, you can add this to your `src/server/config.js` file in the MeeseOS distribution:

```javascript
module.exports = {
	// ... append this to your export ...
	xterm: {
		// You can also set this as a string to force a username
		login: false,
	},
};
```

You can also change the connection arguments:

```javascript
module.exports = {
	// ... append this to your export ...
	xterm: {
		ssh: {
			// Custom hostname
			hostname: "localhost",

			// Custom port
			args: "-p 1022",
		},
	},
};
```
