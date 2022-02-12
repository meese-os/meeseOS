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
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
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

// TODO: Check if host-system:/ '..' is an issue here

import osjs from 'osjs';
import {h, app} from 'hyperapp';

import './index.scss';
import * as translations from './locales.js';
import {name as applicationName} from './metadata.json';
import {
  Box,
  Button,
  TextField,
  Toolbar,
  Menubar,
  MenubarItem,
  Statusbar,
  Panes,
  listView
} from '@osjs/gui';

/**
 * Creates default settings
 */
const createDefaultSettings =  () => ({
  showHiddenFiles: false,
  showDate: false
});

/**
 * Creates the default window options
 */
const createWindowOptions = (core, proc, title) => ({
  id: 'FileManager',
  icon: proc.resource(proc.metadata.icon),
  title,
  attributes: {
    mediaQueries: {
      small: 'screen and (max-width: 400px)'
    }
  },
  dimension: Object.assign({
    width: 400,
    height: 400
  }, core.config('filemanager.defaultWindowSize', {})),
});

/**
 * Diverts callback based on drop action event
 */
const divertDropAction = (browser, virtual) => (ev, data, files) => {
  if (files.length) {
    browser(files);
  } else if (data && data.path && data.filename) {
    virtual(data);
  }
};

/**
 * HoF for dialogs
 */
const usingPositiveButton = cb => (btn, value) => {
  if (['yes', 'ok'].indexOf(btn) !== -1) {
    cb(value);
  }
};

/**
 * Triggers a browser upload
 */
const triggerBrowserUpload = (cb) => {
  const field = document.createElement('input');
  field.type = 'file';
  field.onchange = () => {
    if (field.files.length > 0) {
      cb(field.files);
    }
  };
  field.click();
};

/**
 * Checks if given fielname is a dotted
 */
const isSpecialFile = filename => ['..', '.'].indexOf(filename) !== -1;

/**
 * Creates initial paths
 */
const createInitialPaths = (core, proc) => {
  const homePath = {path: core.config('vfs.defaultPath', 'home:/')};
  const initialPath = proc.args.path
    ? Object.assign({}, homePath, proc.args.path)
    : homePath;

  return {homePath, initialPath};
};

/**
 * Formats file status message
 */
const formatFileMessage = file => `${file.filename} (${file.size} bytes)`;

/**
 * Formats directory status message
 */
const formatStatusMessage = (core) => {
  const {translatable} = core.make('osjs/locale');
  const __ = translatable(translations);

  return (path, files) => {
    const directoryCount = files.filter(f => f.isDirectory).length;
    const fileCount = files.filter(f => !f.isDirectory).length;
    const totalSize = files.reduce((t, f) => t + (f.size || 0), 0);

    return __('LBL_STATUS', directoryCount, fileCount, totalSize);
  };
};

/**
 * Mount view rows Factory
 */
const mountViewRowsFactory = (core) => {
  const fs = core.make('osjs/fs');
  const getMountpoints = () => fs.mountpoints(true);

  return () => getMountpoints().map(m => ({
    columns: [{
      icon: m.icon,
      label: m.label
    }],
    data: m
  }));
};

/**
 * File view columns Factory
 */
const listViewColumnFactory = (core, proc) => {
  const {translate: _, translatable} = core.make('osjs/locale');
  const __ = translatable(translations);

  return () => {
    const columns = [{
      label: _('LBL_NAME'),
      style: {
        minWidth: '20em'
      }
    }];

    if (proc.settings.showDate) {
      columns.push({
        label: __('LBL_DATE')
      });
    }

    return [
      ...columns,
      {
        label: _('LBL_TYPE'),
        style: {
          maxWidth: '150px'
        }
      }, {
        label: _('LBL_SIZE'),
        style: {
          flex: '0 0 7em',
          textAlign: 'right'
        }
      }
    ];
  };
};

/**
 * File view rows Factory
 */
const listViewRowFactory = (core, proc) => {
  const fs = core.make('osjs/fs');
  const {format: formatDate} = core.make('osjs/locale');
  const getFileIcon = file => file.icon || fs.icon(file);

  const formattedDate = f => {
    if (f.stat) {
      const rawDate = f.stat.mtime || f.stat.ctime;
      if (rawDate) {
        try {
          const d = new Date(rawDate);
          return `${formatDate(d, 'shortDate')} ${formatDate(d, 'shortTime')}`;
        } catch (e) {
          return rawDate;
        }
      }
    }

    return '';
  };

  return (list) => list.map(f => {
    const columns = [{
      label: f.filename,
      icon: getFileIcon(f)
    }];

    if (proc.settings.showDate) {
      columns.push(formattedDate(f));
    }

    return {
      key: f.path,
      data: f,
      columns: [
        ...columns,
        f.mime,
        f.humanSize
      ]
    };
  });
};

/**
 * VFS action Factory
 */
const vfsActionFactory = (core, proc, win, dialog, state) => {
  const vfs = core.make('osjs/vfs');
  const {pathJoin} = core.make('osjs/fs');
  const {translatable} = core.make('osjs/locale');
  const __ = translatable(translations);

  const refresh = (fileOrWatch) => {
    // FIXME This should be implemented a bit better
    /*
    if (fileOrWatch === true && core.config('vfs.watch')) {
      return;
    }
    */

    win.emit('filemanager:navigate', state.currentPath, undefined, fileOrWatch);
  };

  const action = async (promiseCallback, refreshValue, defaultError) => {
    try {
      win.setState('loading', true);

      const result = await promiseCallback();
      refresh(refreshValue);
      return result;
    } catch (error) {
      dialog('error', error, defaultError || __('MSG_ERROR'));
    } finally {
      win.setState('loading', false);
    }

    return [];
  };

  const writeRelative = f => {
    const d = dialog('progress', f);

    return vfs.writefile({
      path: pathJoin(state.currentPath.path, f.name)
    }, f, {
      pid: proc.pid,
      onProgress: (ev, p) => d.setProgress(p)
    }).then((result) => {
      d.destroy();
      return result;
    }).catch((error) => {
      d.destroy();
      throw error;
    });
  };

  const uploadBrowserFiles = (files) => {
    Promise.all(files.map(writeRelative))
      .then(() => refresh(files[0].name)) // FIXME: Select all ?
      .catch(error => dialog('error', error, __('MSG_UPLOAD_ERROR')));
  };

  const uploadVirtualFile = (data) => {
    const dest = {path: pathJoin(state.currentPath.path, data.filename)};
    if (dest.path !== data.path) {
      action(() => vfs.copy(data, dest, {pid: proc.pid}), true, __('MSG_UPLOAD_ERROR'));
    }
  };

  const drop = divertDropAction(uploadBrowserFiles, uploadVirtualFile);

  const readdir = async (dir, history, selectFile) => {
    if (win.getState('loading')) {
      return;
    }

    try {
      const message = __('LBL_LOADING', dir.path);
      const options = {
        showHiddenFiles: proc.settings.showHiddenFiles
      };

      win.setState('loading', true);
      win.emit('filemanager:status', message);

      const list = await vfs.readdir(dir, options);

      // NOTE: This sets a restore argument in the application session
      proc.args.path = dir;

      state.currentPath = dir;

      if (typeof history === 'undefined' || history === false) {
        win.emit('filemanager:historyPush', dir);
      } else if (history ===  'clear') {
        win.emit('filemanager:historyClear');
      }

      win.emit('filemanager:readdir', {list, path: dir.path, selectFile});
      win.emit('filemanager:title', dir.path);
    } catch (error) {
      dialog('error', error, __('MSG_READDIR_ERROR', dir.path));
    } finally {
      state.currentFile = undefined;
      win.setState('loading', false);
    }
  };

  const upload = () => triggerBrowserUpload(files => {
    writeRelative(files[0])
      .then(() => refresh(files[0].name))
      .catch(error => dialog('error', error, __('MSG_UPLOAD_ERROR')));
  });

  const paste = (move, currentPath) => ({item, callback}) => {
    const dest = {path: pathJoin(currentPath.path, item.filename)};

    const fn = move
      ? vfs.move(item, dest, {pid: proc.pid})
      : vfs.copy(item, dest, {pid: proc.pid});

    return fn
      .then(() => {
        refresh(true);

        if (typeof callback === 'function') {
          callback();
        }
      })
      .catch(error => dialog('error', error, __('MSG_PASTE_ERROR')));
  };

  return {
    download: file => vfs.download(file),
    upload,
    refresh,
    action,
    drop,
    readdir,
    paste
  };
};

/**
 * Clipboard action Factory
 */
const clipboardActionFactory = (core, state, vfs) => {
  const clipboard = core.make('osjs/clipboard');

  const set = item => clipboard.set(({item}), 'filemanager:copy');

  const cut = item => clipboard.set(({
    item,
    callback: () => core.config('vfs.watch') ? undefined : vfs.refresh(true)
  }), 'filemanager:move');

  const paste = () => {
    if (clipboard.has(/^filemanager:/)) {
      const move = clipboard.has('filemanager:move');
      clipboard.get(move)
        .then(vfs.paste(move, state.currentPath));
    }
  };

  return {set, cut, paste};
};

/**
 * Dialog Factory
 */
const dialogFactory = (core, proc, win) => {
  const vfs = core.make('osjs/vfs');
  const {pathJoin} = core.make('osjs/fs');
  const {translatable} = core.make('osjs/locale');
  const __ = translatable(translations);

  const dialog = (name, args, cb, modal = true) => core.make('osjs/dialog', name, args, {
    parent: win,
    attributes: {modal}
  }, cb);

  const mkdirDialog = (action, currentPath) => dialog('prompt', {
    message: __('DIALOG_MKDIR_MESSAGE'),
    value: __('DIALOG_MKDIR_PLACEHOLDER')
  }, usingPositiveButton(value => {
    const newPath = pathJoin(currentPath.path, value);
    action(() => vfs.mkdir({path: newPath}, {pid: proc.pid}), value, __('MSG_MKDIR_ERROR'));
  }));

  const renameDialog = (action, file) => dialog('prompt', {
    message: __('DIALOG_RENAME_MESSAGE', file.filename),
    value: file.filename
  }, usingPositiveButton(value => {
    const idx = file.path.lastIndexOf(file.filename);
    const newPath = file.path.substr(0, idx) + value;

    action(() => vfs.rename(file, {path: newPath}), value, __('MSG_RENAME_ERROR'));
  }));

  const deleteDialog = (action, file) => dialog('confirm', {
    message: __('DIALOG_DELETE_MESSAGE', file.filename),
  }, usingPositiveButton(() => {
    action(() => vfs.unlink(file, {pid: proc.pid}), true, __('MSG_DELETE_ERROR'));
  }));

  const progressDialog = (file) => dialog('progress', {
    message: __('DIALOG_PROGRESS_MESSAGE', file.name),
    buttons: []
  }, () => {}, false);

  const errorDialog = (error, message) => dialog('alert', {
    type: 'error',
    error,
    message
  }, () => {});

  const dialogs = {
    mkdir: mkdirDialog,
    rename: renameDialog,
    delete: deleteDialog,
    progress: progressDialog,
    error: errorDialog
  };

  return (name, ...args) => {
    if (dialogs[name]) {
      return dialogs[name](...args);
    } else {
      throw new Error(`Invalid dialog: ${name}`);
    }
  };
};

/**
 * Creates Menus
 */
const menuFactory = (core, proc, win) => {
  const fs = core.make('osjs/fs');
  const clipboard = core.make('osjs/clipboard');
  const contextmenu = core.make('osjs/contextmenu');
  const {translate: _, translatable} = core.make('osjs/locale');

  const __ = translatable(translations);
  const getMountpoints = () => fs.mountpoints(true);

  const menuItemsFromMiddleware = async (type, middlewareArgs) => {
    if (!core.has('osjs/middleware')) {
      return [];
    }

    const items = core.make('osjs/middleware')
      .get(`osjs/filemanager:menu:${type}`);

    const promises = items.map(fn => fn(middlewareArgs));

    const resolved = await Promise.all(promises);
    const result = resolved
      .filter(items => items instanceof Array);

    return [].concat(...result);
  };

  const createFileMenu = () => ([
    {label: _('LBL_UPLOAD'), onclick: () => win.emit('filemanager:menu:upload')},
    {label: _('LBL_MKDIR'), onclick: () => win.emit('filemanager:menu:mkdir')},
    {label: _('LBL_QUIT'), onclick: () => win.emit('filemanager:menu:quit')}
  ]);

  const createEditMenu = async (item, isContextMenu) => {
    const emitter = name => win.emit(name, item);

    if (item && isSpecialFile(item.filename)) {
      return [{
        label: _('LBL_GO'),
        onclick: () => emitter('filemanager:navigate')
      }];
    }

    const isValidFile = item && !isSpecialFile(item.filename);
    const isDirectory = item && item.isDirectory;

    const openMenu = isDirectory ? [{
      label: _('LBL_GO'),
      disabled: !item,
      onclick: () => emitter('filemanager:navigate')
    }] : [{
      label: _('LBL_OPEN'),
      disabled: !item,
      onclick: () => emitter('filemanager:open')
    }, {
      label: __('LBL_OPEN_WITH'),
      disabled: !item,
      onclick: () => emitter('filemanager:openWith')
    }];

    const clipboardMenu = [{
      label: _('LBL_COPY'),
      disabled: !isValidFile,
      onclick: () => emitter('filemanager:menu:copy')
    }, {
      label: _('LBL_CUT'),
      disabled: !isValidFile,
      onclick: () => emitter('filemanager:menu:cut')
    }];

    if (!isContextMenu) {
      clipboardMenu.push({
        label: _('LBL_PASTE'),
        disabled: !clipboard.has(/^filemanager:/),
        onclick: () => emitter('filemanager:menu:paste')
      });
    }

    const appendItems = await menuItemsFromMiddleware('edit', {file: item, isContextMenu});

    return [
      ...openMenu,
      {
        label: _('LBL_RENAME'),
        disabled: !isValidFile,
        onclick: () => emitter('filemanager:menu:rename')
      },
      {
        label: _('LBL_DELETE'),
        disabled: !isValidFile,
        onclick: () => emitter('filemanager:menu:delete')
      },
      ...clipboardMenu,
      {
        label: _('LBL_DOWNLOAD'),
        disabled: !item || isDirectory || !isValidFile,
        onclick: () => emitter('filemanager:menu:download')
      },
      ...appendItems
    ];
  };

  const createViewMenu = (state) => ([
    {label: _('LBL_REFRESH'), onclick: () => win.emit('filemanager:menu:refresh')},
    {label: __('LBL_MINIMALISTIC'), checked: state.minimalistic, onclick: () => win.emit('filemanager:menu:toggleMinimalistic')},
    {label: __('LBL_SHOW_DATE'), checked: proc.settings.showDate, onclick: () => win.emit('filemanager:menu:showDate')},
    {label: __('LBL_SHOW_HIDDEN_FILES'), checked: proc.settings.showHiddenFiles, onclick: () => win.emit('filemanager:menu:showHidden')}
  ]);

  const createGoMenu = () => getMountpoints().map(m => ({
    label: m.label,
    icon: m.icon,
    onclick: () => win.emit('filemanager:navigate', {path: m.root})
  }));

  const menuItems = {
    file: createFileMenu,
    edit: createEditMenu,
    view: createViewMenu,
    go: createGoMenu
  };

  return async ({name, ev}, args, isContextMenu = false) => {
    if (menuItems[name]) {
      contextmenu.show({
        menu: await menuItems[name](args, isContextMenu),
        position: isContextMenu ? ev : ev.target
      });
    } else {
      throw new Error(`Invalid menu: ${name}`);
    }
  };
};

/**
 * Creates a new FileManager user interface view
 */
const createView = (core, proc, win) => {
  const {icon} = core.make('osjs/theme');
  const {translate: _} = core.make('osjs/locale');

  const onMenuClick = (name, args) => ev => win.emit('filemanager:menu', {ev, name}, args);
  const onInputEnter = (ev, value) => win.emit('filemanager:navigate', {path: value});

  const canGoBack = ({list, index}) => !list.length || index <= 0;
  const canGoForward = ({list, index}) => !list.length || (index === list.length - 1);

  return (state, actions) => {
    const FileView = listView.component(state.fileview, actions.fileview);
    const MountView = listView.component(state.mountview, actions.mountview);

    return h(Box, {
      class: state.minimalistic ? 'osjs-filemanager-minimalistic' : ''
    }, [
      h(Menubar, {}, [
        h(MenubarItem, {onclick: onMenuClick('file')}, _('LBL_FILE')),
        h(MenubarItem, {onclick: onMenuClick('edit')}, _('LBL_EDIT')),
        h(MenubarItem, {onclick: onMenuClick('view', state)}, _('LBL_VIEW')),
        h(MenubarItem, {onclick: onMenuClick('go')}, _('LBL_GO'))
      ]),
      h(Toolbar, {}, [
        h(Button, {
          title: _('LBL_BACK'),
          icon: icon('go-previous'),
          disabled: canGoBack(state.history),
          onclick: () => actions.history.back()
        }),
        h(Button, {
          title: _('LBL_FORWARD'),
          icon: icon('go-next'),
          disabled: canGoForward(state.history),
          onclick: () => actions.history.forward()
        }),
        h(Button, {
          title: _('LBL_HOME'),
          icon: icon('go-home'),
          onclick: () => win.emit('filemanager:home')
        }),
        h(TextField, {
          value: state.path,
          box: {grow: 1, shrink: 1},
          onenter: onInputEnter
        })
      ]),
      h(Panes, {style: {flex: '1 1'}}, [
        h(MountView),
        h(FileView)
      ]),
      h(Statusbar, {}, h('span', {}, state.status))
    ]);
  };
};

/**
 * Creates a new FileManager user interface
 */
const createApplication = (core, proc) => {
  const createColumns = listViewColumnFactory(core, proc);
  const createRows = listViewRowFactory(core, proc);
  const createMounts = mountViewRowsFactory(core);
  const {draggable} = core.make('osjs/dnd');
  const statusMessage = formatStatusMessage(core);

  const initialState = {
    path: '',
    status: '',
    minimalistic: false,

    history: {
      index: -1,
      list: []
    },

    mountview: listView.state({
      class: 'osjs-gui-fill',
      columns: ['Name'],
      hideColumns: true,
      rows: createMounts()
    }),

    fileview: listView.state({
      columns: []
    })
  };

  const createActions = (win) => ({
    history: {
      clear: () => ({index: -1, list: []}),

      push: (path) => ({index, list}) => {
        const newList = index === -1 ? [] : list;
        const lastHistory = newList[newList.length - 1];
        const newIndex = lastHistory === path
          ? newList.length - 1
          : newList.push(path) - 1;

        return {list: newList, index: newIndex};
      },

      back: () => ({index, list}) => {
        const newIndex = Math.max(0, index - 1);
        win.emit('filemanager:navigate', list[newIndex], true);
        return {index: newIndex};
      },

      forward: () => ({index, list}) => {
        const newIndex = Math.min(list.length - 1, index + 1);
        win.emit('filemanager:navigate', list[newIndex], true);
        return {index: newIndex};
      }
    },

    toggleMinimalistic: () => ({minimalistic}) => ({minimalistic: !minimalistic}),

    setPath: path => ({path}),
    setStatus: status => ({status}),
    setMinimalistic: minimalistic => ({minimalistic}),
    setList: ({list, path, selectFile}) => ({fileview, mountview}) => {
      let selectedIndex;

      if (selectFile) {
        const foundIndex = list.findIndex(file => file.filename === selectFile);
        if (foundIndex !== -1) {
          selectedIndex = foundIndex;
        }
      }

      return {
        path,
        status: statusMessage(path, list),
        mountview: Object.assign({}, mountview, {
          rows: createMounts()
        }),
        fileview: Object.assign({}, fileview, {
          selectedIndex,
          columns: createColumns(),
          rows: createRows(list)
        })
      };
    },

    mountview: listView.actions({
      select: ({data}) => win.emit('filemanager:navigate', {path: data.root})
    }),

    fileview: listView.actions({
      select: ({data}) => win.emit('filemanager:select', data),
      activate: ({data}) => win.emit(`filemanager:${data.isFile ? 'open' : 'navigate'}`, data),
      contextmenu: args => win.emit('filemanager:contextmenu', args),
      created: ({el, data}) => {
        if (data.isFile) {
          draggable(el, {data});
        }
      }
    })
  });

  return ($content, win) => {
    const actions = createActions(win);
    const view = createView(core, proc, win);
    return app(initialState, actions, view, $content);
  };
};

/**
 * Creates a new FileManager window
 */
const createWindow = (core, proc) => {
  let wired;
  const state = {currentFile: undefined, currentPath: undefined};
  const {homePath, initialPath} = createInitialPaths(core, proc);

  const title = core.make('osjs/locale').translatableFlat(proc.metadata.title);
  const win = proc.createWindow(createWindowOptions(core, proc, title));
  const render = createApplication(core, proc);
  const dialog = dialogFactory(core, proc, win);
  const createMenu = menuFactory(core, proc, win);
  const vfs = vfsActionFactory(core, proc, win, dialog, state);
  const clipboard = clipboardActionFactory(core, state, vfs);

  const setSetting = (key, value) => proc.emit('filemanager:setting', key, value);
  const onTitle = append => win.setTitle(`${title} - ${append}`);
  const onStatus = message => wired.setStatus(message);
  const onRender = () => vfs.readdir(initialPath);
  const onDestroy = () => proc.destroy();
  const onDrop = (...args) => vfs.drop(...args);
  const onHome = () => vfs.readdir(homePath, 'clear');
  const onNavigate = (...args) => vfs.readdir(...args);
  const onSelectItem = file => (state.currentFile = file);
  const onSelectStatus = file => win.emit('filemanager:status', formatFileMessage(file));
  const onContextMenu = ({ev, data}) => createMenu({ev, name: 'edit'}, data, true);
  const onReaddirRender = args => wired.setList(args);
  const onRefresh = (...args) => vfs.refresh(...args);
  const onOpen = file => core.open(file, {useDefault: true});
  const onOpenWith = file => core.open(file, {useDefault: true, forceDialog: true});
  const onHistoryPush = file => wired.history.push(file);
  const onHistoryClear = () => wired.history.clear();
  const onMenu = (props, args) => createMenu(props, args || state.currentFile);
  const onMenuUpload = (...args) => vfs.upload(...args);
  const onMenuMkdir = () => dialog('mkdir', vfs.action, state.currentPath);
  const onMenuQuit = () => proc.destroy();
  const onMenuRefresh = () => vfs.refresh();
  const onMenuToggleMinimalistic = () => wired.toggleMinimalistic();
  const onMenuShowDate = () => setSetting('showDate', !proc.settings.showDate);
  const onMenuShowHidden = () => setSetting('showHiddenFiles', !proc.settings.showHiddenFiles);
  const onMenuRename = file => dialog('rename', vfs.action, file);
  const onMenuDelete = file => dialog('delete', vfs.action, file);
  const onMenuDownload = (...args) => vfs.download(...args);
  const onMenuCopy = item => clipboard.set(item);
  const onMenuCut = item => clipboard.cut(item);
  const onMenuPaste = () => clipboard.paste();

  return win
    .once('render', () => win.focus())
    .once('destroy', () => (wired = undefined))
    .once('render', onRender)
    .once('destroy', onDestroy)
    .on('drop', onDrop)
    .on('filemanager:title', onTitle)
    .on('filemanager:status', onStatus)
    .on('filemanager:menu', onMenu)
    .on('filemanager:home', onHome)
    .on('filemanager:navigate', onNavigate)
    .on('filemanager:select', onSelectItem)
    .on('filemanager:select', onSelectStatus)
    .on('filemanager:contextmenu', onContextMenu)
    .on('filemanager:readdir', onReaddirRender)
    .on('filemanager:refresh', onRefresh)
    .on('filemanager:open', onOpen)
    .on('filemanager:openWith', onOpenWith)
    .on('filemanager:historyPush', onHistoryPush)
    .on('filemanager:historyClear', onHistoryClear)
    .on('filemanager:menu:upload', onMenuUpload)
    .on('filemanager:menu:mkdir', onMenuMkdir)
    .on('filemanager:menu:quit', onMenuQuit)
    .on('filemanager:menu:refresh', onMenuRefresh)
    .on('filemanager:menu:toggleMinimalistic', onMenuToggleMinimalistic)
    .on('filemanager:menu:showDate', onMenuShowDate)
    .on('filemanager:menu:showHidden', onMenuShowHidden)
    .on('filemanager:menu:copy', onMenuCopy)
    .on('filemanager:menu:cut', onMenuCut)
    .on('filemanager:menu:paste', onMenuPaste)
    .on('filemanager:menu:rename', onMenuRename)
    .on('filemanager:menu:delete', onMenuDelete)
    .on('filemanager:menu:download', onMenuDownload)
    .render(($content, win) => (wired = render($content, win)));
};

/**
 * Launches the OS.js application process
 */
const createProcess = (core, args, options, metadata) => {
  const proc = core.make('osjs/application', {
    args,
    metadata,
    options: Object.assign({}, options, {
      settings: createDefaultSettings()
    })
  });

  const emitter = proc.emitAll();
  const win = createWindow(core, proc);

  const onSettingsUpdate = (settings) => {
    proc.settings = Object.assign({}, proc.settings, settings);
    win.emit('filemanager:refresh');
  };

  const onSetting = (key, value) => {
    onSettingsUpdate({[key]: value});

    proc.saveSettings()
      .then(() => emitter('osjs:filemanager:remote', proc.settings))
      .catch(error => console.warn(error));
  };

  proc.on('osjs:filemanager:remote', onSettingsUpdate);
  proc.on('filemanager:setting', onSetting);

  const listener = (args) => {
    if (args.pid === proc.pid) {
      return;
    }

    const currentPath = String(proc.args.path.path).replace(/\/$/, '');
    const watchPath = String(args.path).replace(/\/$/, '');
    if (currentPath === watchPath) {
      win.emit('filemanager:refresh');
    }
  };

  core.on('osjs/vfs:directoryChanged', listener);
  proc.on('destroy', () => core.off('osjs/vfs:directoryChanged', listener));

  return proc;
};

osjs.register(applicationName, createProcess);
