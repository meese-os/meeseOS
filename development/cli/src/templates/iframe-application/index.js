import osjs from 'osjs';
import {name as applicationName} from './metadata.json';

// Our launcher
const register = (core, args, options, metadata) => {
  // Create a new Application instance
  const proc = core.make('osjs/application', {args, options, metadata});

  // Create  a new Window instance
  proc
    .createWindow({
      id: '___NAME___Window',
      title: metadata.title.en_EN,
      icon: proc.resource(proc.metadata.icon),
      dimension: {width: 400, height: 400},
      position: {left: 700, top: 200}
    })
    .on('destroy', () => proc.destroy())
    .render($content => {
      const iframe = document.createElement('iframe');
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.src = proc.resource('/data/index.html');
      iframe.setAttribute('border', '0');
      $content.appendChild(iframe);
    });

  return proc;
};

// Creates the internal callback function when OS.js launches an application
osjs.register(applicationName, register);
