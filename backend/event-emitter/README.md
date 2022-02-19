<p align="center">
  <img alt="OS.js Logo" src="https://raw.githubusercontent.com/os-js/gfx/master/logo-big.png" />
</p>

[OS.js](https://www.os-js.org/) is an [open-source](https://raw.githubusercontent.com/os-js/OS.js/master/LICENSE) web desktop platform with a window manager, application APIs, GUI toolkit, filesystem abstractions and much more.

# OS.js EventEmitter

This is a EventEmitter implementation for OS.js.

## API

```javascript
on("event-name", () => {}); // Fired every time event is emitted
once("event-name", () => {}); // Fires only once and is forgotten
off("event-name", () => {}); // Removes listener
off("event-name"); // Removes all listeners of this type
off(); // Removes all listeners

on("event-name", () => {}, { persist: true }); // Will not be removed unless forced
off("event-name", () => {}, true); // Force removal
```
