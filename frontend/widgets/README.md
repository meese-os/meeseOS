<p align="center">
  <img alt="OS.js Logo" src="https://raw.githubusercontent.com/os-js/gfx/master/logo-big.png" />
</p>

[OS.js](https://www.os-js.org/) is an [open-source](https://raw.githubusercontent.com/os-js/OS.js/master/LICENSE) web desktop platform with a window manager, application APIs, GUI toolkit, filesystem abstractions and much more.

# MeeseOS Widgets module

This is the Widgets module for MeeseOS

- https://manual.os-js.org/v3/install/
- https://manual.os-js.org/v3/guide/provider/
- https://manual.os-js.org/v3/tutorial/widget/

## Usage

In your client bootstrap (`src/client/index.js`):

```javascript
import { WidgetServiceProvider } from "@aaronmeese.com/widgets";

meeseOS.register(WidgetServiceProvider);
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
			widgets: [
				{
					name: "digitalclock",
				},
			];
		}
	}
}
```

A contextmenu entry on the desktop is automatically added so users can add these themselves.
