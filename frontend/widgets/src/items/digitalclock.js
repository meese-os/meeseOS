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

import Widget from '../widget';

const getFont = (fontFamily, size) => String(size) + 'px ' + fontFamily;

const getTime = now => [
  now.getHours(),
  now.getMinutes(),
  now.getSeconds()
]
  .map(int => String(int).padStart(2, '0'))
  .join(':');

const getFontSize = (fontFamily, initialSize, maxWidth, context) => {
  const txt = '99:99:99';

  let size = initialSize;
  while (size > 0) {
    context.font = getFont(fontFamily, size);

    const measuredWidth = context.measureText(txt).width;
    if (measuredWidth < maxWidth) {
      break;
    }

    size--;
  }

  return size;
};

export default class DigitalClockWidget extends Widget {

  constructor(core, options) {
    super(core, options, {
      dimension: {
        width: 300,
        height: 50
      }
    }, {
      fontFamily: 'Monospace',
      fontColor: '#ffffff'
    });

    this.$tmpCanvas = document.createElement('canvas');
    this.tmpContext = this.$tmpCanvas.getContext('2d');
  }

  compute() {
    const {fontFamily, fontColor} = this.options;
    const {width, height} = this.$canvas;
    const {$tmpCanvas, tmpContext} = this;
    const size = getFontSize(fontFamily, height, width, tmpContext);

    $tmpCanvas.width = width;
    $tmpCanvas.height = size;

    tmpContext.font = getFont(fontFamily, size);
    tmpContext.fillStyle = fontColor;
    tmpContext.textAlign = 'center';
    tmpContext.textBaseline = 'middle';
  }

  onResize() {
    this.compute();
  }

  render({context, width, height}) {
    const {$tmpCanvas, tmpContext} = this;
    const tmpWidth = $tmpCanvas.width;
    const tmpHeight = $tmpCanvas.height;
    const x = (width / 2) - (tmpWidth / 2);
    const y = (height / 2) - (tmpHeight / 2);
    const text = getTime(new Date());

    tmpContext.clearRect(0, 0, tmpWidth, tmpHeight);
    tmpContext.fillText(text, tmpWidth / 2, tmpHeight / 2);
    context.clearRect(0, 0, width, height);
    context.drawImage($tmpCanvas, x, y, tmpWidth, tmpHeight);
  }

  getContextMenu() {
    return [{
      label: 'Set Color',
      onclick: () => this.createColorDialog()
    }, {
      label: 'Set Font',
      onclick: () => this.createFontDialog()
    }];
  }

  createFontDialog() {
    this.core.make('meeseOS/dialog', 'font', {
      name: this.options.fontFamily,
      controls: ['name']
    }, (btn, value) => {
      if (btn === 'ok') {
        this.options.fontFamily = value.name;
        this.compute();
        this.saveSettings();
      }
    });
  }

  createColorDialog() {
    this.core.make('meeseOS/dialog', 'color', {
      color: this.options.fontColor
    }, (btn, value) => {
      if (btn === 'ok') {
        this.options.fontColor = value.hex;
        this.compute();
        this.saveSettings();
      }
    });
  }

  static metadata() {
    return {
      ...super.metadata(),
      title: 'Digital Clock'
    };
  }
}
