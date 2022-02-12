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
const fs = require('fs-extra');
const path = require('path');
const webpack = require('webpack');

const unique = arr => arr.filter((elem, pos, arr) => arr.indexOf(elem) === pos);

const npmDirectories = npmFile => fs.readJson(npmFile)
  .then(npm => {
    const parent = path.dirname(npmFile);
    const list = [
      ...Object.keys(npm.dependencies || {}),
      ...Object.keys(npm.devDependencies || {})
    ];

    return list.map(filename => path.resolve(parent, 'node_modules', filename));
  });

const realpaths = list => Promise.all(list.map(fn => fs.realpath(fn).catch(err => false)))
  .then(list => list.filter(value => value !== false));

const directories = options =>
  fs.readJson(options.packages)
    .then(pkgs => {
      return npmDirectories(options.npm)
        .then(list => [...pkgs, ...list]);
    })
    .then(list => {
      const subs = list.map(iter => path.resolve(iter, 'package.json'));

      return Promise.all(subs.map(npmDirectories))
        .then(subList => {
          return [].concat(...subList);
        })
        .then(subList => ([...list, ...subList]));
    });

const filter = list => Promise.all(list.map(dir => {
  const filename = path.resolve(dir, 'webpack.config.js');

  return fs.exists(filename)
    .then(exists => exists ? filename : false);
})).then(list => list.filter(val => val !== false));

const read = list => Promise.all(list.map(filename => require(filename)));

const wlog = (logger, cb) => (err, status) => {
  if (err) {
    logger.warn('An error occured while building');
    logger.fatal(new Error(err.stack || err));
  } else {
    console.log(status.toString({
      colors: true
    }));

    const {warnings, errors} = status.toJson();
    const truncated = str => ((str.split('\n').slice(0, 3).join('\n')) + '...');
    const append = [];

    if (status.hasErrors()) {
      append.push(`With ${errors.length} error(s)`);
    }

    if (status.hasWarnings()) {
      append.push(`With ${warnings.length} warning(s)`);
    }

    warnings.forEach(warn => logger.warn(truncated(warn)));
    errors.forEach(error => logger.fatal(truncated(error)));

    const msg = append.length ? `, with ${append.join(' and ')}` : '';
    logger.success('Build successful' + msg);
  }

  if (typeof cb === 'function') {
    cb(err, status);
  }
};


const action = async ({logger, options, args}) => {
  logger.info('Looking up npm packages...');

  const print = list => {
    list.forEach(filename => logger.info(`Watching ${filename}`));
    return list;
  };

  return directories(options)
    .then(realpaths)
    .then(filter)
    .then(unique)
    .then(fileList => {
      print(fileList);

      return read(fileList)
        .then(list => {
          return webpack(list)
            .watch({}, wlog(logger, () => print(fileList)));
        });
    });
};

module.exports = {
  'watch:all': {
    description: 'Watch all linked node packages',
    action
  }
};
