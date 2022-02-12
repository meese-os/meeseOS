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
import {
  Toolbar,
  SelectField,
  TextareaField
} from '@osjs/gui';

/**
 * Default OS.js Font Dialog
 */
export default class FontDialog extends Dialog {

  /**
   * Constructor
   * @param {Core} core OS.js Core reference
   * @param {Object} args Arguments given from service creation
   * @param {number} [args.minSize=6] Minimum size
   * @param {number} [args.maxSize] Maximum size
   * @param {string} [args.unit=px] Unit
   * @param {string} [args.name] Initial font name
   * @param {number} [args.size] Initial font size
   * @param {string} [args.text] What text to preview
   * @param {string[]} [args.controls] What controls to show
   * @param {string[]} [args.fonts] List of fonts
   * @param {Function} callback The callback function
   */
  constructor(core, args, callback) {
    args = Object.assign({}, {
      title: 'Chose Font',
      minSize: 6,
      maxSize: 48,
      unit: 'px',
      name: 'Roboto',
      size: 10,
      style: 'regular',
      text: 'The quick brown fox jumps over the lazy dog',
      controls: ['size', 'name', 'style'],
      fonts: [
        'Roboto',
        'arial',
        'sans-serif',
        'monospace'
      ]
    }, args);

    super(core, args, {
      className: 'info',
      window: {
        title: args.title,
        attributes: {
          minDimension: {
            width: 400,
            height: 200
          }
        }
      },
      buttons: ['ok', 'cancel']
    }, callback);

    this.value = {
      name: this.args.name,
      size: this.args.size,
      style: this.args.style
    };
  }

  render(options) {
    const fontSizes = Array(this.args.maxSize - this.args.minSize)
      .fill(0)
      .map((v, i) => this.args.minSize + i)
      .reduce((o, i) => Object.assign(o, {[i]: i}), {});

    const fontNames = this.args.fonts
      .reduce((o, i) => {
        const k = i.toLowerCase();
        return Object.assign(o, {[k]: i});
      }, {});

    const fontStyles = {
      'regular': 'Regular',
      'bold': 'Bold',
      'italic': 'Italic'
    };

    const initialState = Object.assign({}, this.value);
    const initialActions = {
      setSize: size => state => {
        this.value.size = size;
        return {size};
      },
      setFont: name => state => {
        this.value.name = name;
        return {name};
      },
      setStyle: style => state => {
        this.value.style = style;
        return {style};
      }
    };

    super.render(options, ($content) => {
      app(initialState, initialActions, (state, actions) => this.createView([
        h(Toolbar, {}, [
          h(SelectField, {
            box: {grow: 1, style: {display: this.args.controls.indexOf('size') !== -1 ? 'flex' : 'none'}},
            value: state.size,
            choices: fontSizes,
            onchange: (ev, v) => actions.setSize(v)
          }),
          h(SelectField, {
            box: {grow: 1, style: {display: this.args.controls.indexOf('name') !== -1 ? 'flex' : 'none'}},
            value: state.name.toLowerCase(),
            choices: fontNames,
            onchange: (ev, v) => actions.setFont(v)
          }),
          h(SelectField, {
            box: {grow: 1, style: {display: this.args.controls.indexOf('style') !== -1 ? 'flex' : 'none'}},
            value: state.size,
            choices: fontStyles,
            onchange: (ev, v) => actions.setStyle(v)
          })
        ]),
        h(TextareaField, {
          box: {grow: 1},
          value: this.args.text,
          style: {
            fontFamily: state.name,
            fontSize: `${state.size}${this.args.unit}`,
            fontWeight: state.style === 'bold' ? 'bold' : 'normal',
            fontStyle: state.style !== 'bold' ? state.style : 'normal',
            height: '4rem',
            overflow: 'hidden',
            whiteSpace: 'nowrap'
          }
        })
      ]), $content);
    });
  }

}
