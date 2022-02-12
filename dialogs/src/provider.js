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

import AlertDialog from './dialogs/alert';
import ConfirmDialog from './dialogs/confirm';
import PromptDialog from './dialogs/prompt';
import ProgressDialog from './dialogs/progress';
import ColorDialog from './dialogs/color';
import FontDialog from './dialogs/font';
import FileDialog from './dialogs/file';
import ChoiceDialog from './dialogs/choice';
import DefaultApplicationDialog from './dialogs/default-application';
import CustomDialog from './dialogs/custom';

export default class DialogServiceProvider {

  constructor(core, args = {}) {
    this.core = core;
    this.registry = Object.assign({
      alert: AlertDialog,
      confirm: ConfirmDialog,
      prompt: PromptDialog,
      progress: ProgressDialog,
      color: ColorDialog,
      font: FontDialog,
      file: FileDialog,
      choice: ChoiceDialog,
      defaultApplication: DefaultApplicationDialog
    }, args.registry || {});
  }

  destroy() {
  }

  async init() {
    this.core.instance('osjs/dialog', (name, args = {}, ...eargs) => {
      const options = eargs.length > 1 ? eargs[0] : {};
      const callback = eargs[eargs.length > 1 ? 1 : 0];

      if (!this.registry[name]) {
        throw new Error(`Dialog '${name}' does not exist`);
      }

      if (typeof callback !== 'function') {
        throw new Error('Dialog requires a callback');
      }

      const instance = new this.registry[name](this.core, args, callback);
      instance.render(options);
      return instance;
    });

    this.core.singleton('osjs/dialogs', () => ({
      create: (options, valueCallback, callback) => {
        return new CustomDialog(this.core, options, valueCallback, callback);
      },

      register: (name, classRef) => {
        if (this.registry[name]) {
          console.warn('Overwriting previously registered dialog', name);
        }

        this.registry[name] = classRef;
      }
    }));
  }

  start() {
  }

}

