# karameese.com

Kara Meese's personal website codebase.

[![Netlify Status](https://api.netlify.com/api/v1/badges/dcf3bef2-ca38-415e-8bee-bf8f873a8168/deploy-status)](https://app.netlify.com/sites/karameese/deploys)

This project has been modified from [this repository](https://github.com/chetanverma16/react-portfolio-template),
it is not my original work.

## Setup

1. PHP Setup

- `sudo nano /etc/php/8.0/fpm/php.ini` to turn on `display_errors` and `display_startup_errors`
  - `Ctrl+w` to search for `display_errors`
  - `sudo service php8.0-fpm restart` to restart the service
  - `sudo systemctl enable php8.0-fpm` to enable the service at boot
  - `sudo chmod 777 karameese.com` to grant access to the PHP daemon

2. Email Setup

- Add `contactform@karameese.com` to your email contacts, so the messages won't be filtered out as spam!

3. Old Site Setup

- `yarn install`
- `yarn run build`

TODO:

- On window resize, make sure all small windows are updated to remain on the screen
- Figure out an implementation for mobile
- GPT-3 for AI, how to tie to OS without doing everything manually?
- Easter egg button to switch between gradient and solid color stops in vis
- Rearranging tasks on taskbar
- Drag desktop icons
- https://github.com/ProjectOpenSea/opensea-whitelabel/issues/10#issuecomment-866398011
- Capability to zoom in on images like https://www.w3schools.com/howto/howto_js_image_magnifier_glass.asp
- Set up a CI for building and configuring the site on the server, like Gatsby did before
