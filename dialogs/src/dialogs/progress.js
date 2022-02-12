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
import {Box, Progressbar} from '@osjs/gui';

/**
 * Default OS.js Progress Dialog
 */
export default class ProgressDialog extends Dialog {

  /**
   * Constructor
   * @param {Core} core OS.js Core reference
   * @param {Object} args Arguments given from service creation
   * @param {String} [args.title] Dialog title
   * @param {String} [args.message] Dialog message
   * @param {String} [args.status] Dialog status message
   * @param {String} [args.progress] Initial progress value
   * @param {String[]} [args.buttons] Override dialog buttons
   * @param {Function} callback The callback function
   */
  constructor(core, args, callback) {
    super(core, args, {
      className: 'progress',
      buttons: args.buttons || ['cancel'],
      window: {
        title: args.title || 'Progress',
        attributes: {
          minDimension: {
            width: 500,
            height: 200
          }
        }
      }
    }, callback);

    this.value = this.args.progress || 0;
    this.status = this.args.status || '';
    this.app = null;
  }

  render(options) {
    super.render(options, ($content) => {
      this.app = app({
        progress: this.value,
        status: this.status
      }, {
        setProgress: progress => state => ({progress}),
        setStatus: status => state => ({status})
      }, (state, actions) => this.createView([
        h(Box, {grow: 1, shrink: 1}, [
          h('div', {class: 'osjs-dialog-message'}, String(this.args.message)),
          h('div', {class: 'osjs-dialog-status'}, String(state.status)),
          h(Progressbar, {value: state.progress})
        ])
      ]), $content);
    });
  }

  /**
   * Set the progress value
   * @param {Number} value A value between 0 and 100
   */
  setProgress(value) {
    this.app.setProgress(value);
  }

  /**
   * Set the status text
   * @param {String} status Status text
   */
  setStatus(status) {
    this.app.setStatus(status);
  }

}

