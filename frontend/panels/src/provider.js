/*
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
import Panel from './panel';
import WindowsPanelItem from './items/windows';
import TrayPanelItem from './items/tray';
import ClockPanelItem from './items/clock';
import MenuPanelItem from './items/menu';

/**
 * Panel Service Provider
 *
 * @desc Provides methods to handle panels on a desktop in OS.js
 */
export default class PanelServiceProvider {

  constructor(core, args = {}) {
    this.core = core;
    this.panels = [];
    this.inited = false;
    this.registry = Object.assign({
      menu: MenuPanelItem,
      windows: WindowsPanelItem,
      tray: TrayPanelItem,
      clock: ClockPanelItem
    }, args.registry || {});
  }

  destroy() {
    this.inited = false;
    this.panels.forEach(panel => panel.destroy());
    this.panels = [];
  }

  async init() {
    this.core.singleton('meeseOS/panels', () => ({
      register: (name, classRef) => {
        if (this.registry[name]) {
          console.warn('Overwriting previously registered panel item', name);
        }

        this.registry[name] = classRef;
      },

      removeAll: () => {
        this.panels.forEach(p => p.destroy());
        this.panels = [];
      },

      remove: (panel) => {
        const index = typeof panel === 'number'
          ? panel
          : this.panels.findIndex(p => p === panel);

        if (index >= 0) {
          this.panels[index].destroy();
          this.panels.splice(index, 1);
        }
      },

      create: (options) => {
        const panel = new Panel(this.core, options);

        this.panels.push(panel);

        panel.on('destroy', () => this.core.emit('meeseOS/panel:destroy', panel, this.panels));
        panel.on('create', () => setTimeout(() => {
          this.core.emit('meeseOS/panel:create', panel, this.panels);
        }, 1));

        if (this.inited) {
          panel.init();
        }
      },

      save: () => {
        const settings = this.core.make('meeseOS/settings');
        const panels = this.panels.map(panel => panel.options);

        return Promise.resolve(settings.set('meeseOS/desktop', 'panels', panels))
          .then(() => settings.save());
      },

      get: (name) => this.registry[name]
    }));
  }

  start() {
    this.inited = true;
    this.panels.forEach(p => p.init());
  }

}
