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

import {h, app} from 'hyperapp';
import Dialog from '../dialog';
import {Box} from '@osjs/gui';

/**
 * Default OS.js Confirm Dialog
 */
export default class ConfirmDialog extends Dialog {

  /**
   * Constructor
   * @param {Core} core OS.js Core reference
   * @param {Object} args Arguments given from service creation
   * @param {String} [args.title] Dialog title
   * @param {String} [args.message] Dialog message
   * @param {Boolean} [args.yesno=true] Yes/No or Ok/Cancel
   * @param {String[]} [args.buttons] Custom buttons
   * @param {Function} callback The callback function
   */
  constructor(core, args, callback) {
    const yesno = typeof args.yesno === 'undefined' || args.yesno === true;

    const buttons = args.buttons instanceof Array
      ? args.buttons
      : yesno ? ['yes', 'no'] : ['ok', 'cancel'];

    super(core, args, {
      className: 'confirm',
      window: {
        title: args.title || 'Confirm',
        attributes: {
          minDimension: {
            height: 140
          }
        }
      },
      buttons
    }, callback);
  }

  render(options) {
    super.render(options, ($content) => {
      app({}, {}, (state, actions) => this.createView([
        h(Box, {grow: 1}, [
          h('div', {class: 'osjs-dialog-message'}, String(this.args.message))
        ])
      ]), $content);
    });
  }

}

