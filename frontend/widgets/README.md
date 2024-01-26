# MeeseOS Widgets module

This is the Widgets module for MeeseOS

- https://manual.os-js.org/v3/install/
- https://manual.os-js.org/v3/guide/provider/
- https://manual.os-js.org/v3/tutorial/widget/

## Usage

In your client bootstrap (`src/client/index.js`):

```js
import { WidgetServiceProvider } from "@aaronmeese.com/widgets";

meeseOS.register(WidgetServiceProvider);
```

And in your stylesheet (`src/client/index.scss`):

```css
@import "~@aaronmeese.com/widgets/dist/main.css";
```

To set up a default set of widgets in the user settings, modify your client configuration file (`src/client/config.js`):

```js
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

TODO: Figure out how to move the widgets on mobile.
