/*!
 * OS.js - JavaScript Cloud/Web Desktop Platform
 *
 * Copyright (c) 2011-2020, Anders Evenrud <andersevenrud@gmail.com>
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR ha PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * @author  Anders Evenrud <andersevenrud@gmail.com>
 * @licence Simplified BSD License
 */

import {h, app} from 'hyperapp';
import {Box, TextareaField, Menubar, MenubarItem} from '@aaronmeese.com/gui';
import osjs from 'osjs';
import {name as applicationName} from './metadata.json';

// File menu
const createMenu = (current, actions) => ([
  {label: 'New', onclick: () => actions.menuNew()},
  {label: 'Open', onclick: () => actions.menuOpen()},
  {label: 'Save', disabled: !current, onclick: () => actions.menuSave()},
  {label: 'Save As', onclick: () => actions.menuSaveAs()},
  {label: 'Quit', onclick: () => actions.menuQuit()}
]);

// OS.js application
const createApplication = (core, proc, win, $content) => {
  const vfs = core.make('osjs/vfs');
  const basic = core.make('osjs/basic-application', proc, win, {
    defaultFilename: 'New File.txt'
  });

  // Hyperapp
  const ha = app({
    text: ''
  }, {
    setText: text => state => ({text}),

    save: () => state => {
      if (proc.args.file) {
        const contents = $content.querySelector('textarea').value;
        vfs.writefile(proc.args.file, contents);
      }
    },

    load: item => (state, actions) => {
      vfs.readfile(item)
        .then(contents => actions.setText(contents))
        .catch(error => console.error(error)); // FIXME: Dialog
    },

    menu: ev => (state, actions) => {
      core.make('osjs/contextmenu').show({
        position: ev.target,
        menu: createMenu(proc.args.file, actions)
      });
    },

    menuNew: () => state => basic.createNew(),
    menuOpen: () => state => basic.createOpenDialog(),
    menuSave: () => (state, actions) => actions.save(),
    menuSaveAs: () => state => basic.createSaveDialog(),
    menuQuit: () => state => proc.destroy()
  }, (state, actions) => {
    return h(Box, {}, [
      h(Menubar, {}, [
        h(MenubarItem, {
          onclick: ev => actions.menu(ev)
        }, 'File')
      ]),
      h(TextareaField, {
        box: {grow: 1},
        value: state.text,
        oninput: (ev, value) => actions.setText(value)
      })
    ]);
  }, $content);


  win.on('drop', (ev, data) => {
    if (data.isFile && data.mime) {
      const found = proc.metadata.mimes.find(m => (new RegExp(m)).test(data.mime));
      if (found) {
        basic.open(data);
      }
    }
  });
  proc.on('destroy', () => basic.destroy());
  basic.on('new-file', () => ha.setText(''));
  basic.on('save-file', ha.save);
  basic.on('open-file', ha.load);
  basic.init();
};

// OS.js window
const createMainWindow = (core, proc) => {
  proc.createWindow({
    id: 'TextpadWindow',
    icon: proc.resource(proc.metadata.icon),
    dimension: {width: 400, height: 400}
  })
    .on('destroy', () => proc.destroy())
    .on('render', (win) => win.focus())
    .render(($content, win) => createApplication(core, proc, win, $content));
};

const createProcess = (core, args, options, metadata) => {
  const proc = core.make('osjs/application', {args, options, metadata});
  createMainWindow(core, proc);
  return proc;
};

osjs.register(applicationName, createProcess);
