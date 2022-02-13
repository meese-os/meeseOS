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
const consola = require('consola');
const commander = require('commander');
const getopts = require('getopts');
const {createOptions, resolveOptions, loadTasks} = require('./utils.js');
const {version} = require('../package.json');

const DEFAULT_TASKS = {
  ...require('./tasks/info.js'),
  // ...require('./tasks/watch.js'),
  ...require('./tasks/discover.js'),
  ...require('./tasks/scaffold.js')
};

const error = msg => {
  console.error(msg);
  process.exit(1);
};

const load = filename => {
  let result = {};
  if (fs.existsSync(filename)) {
    try {
      result = require(filename);
    } catch (e) {
      consola.warn('An error occured while loading cli config');
      consola.fatal(new Error(e));
    }
  }

  return result;
};

const cli = async (argv = [], opts = {}) => {
  commander
    .version(version)
    .option('--dist [dist]', 'Target dist directory (\'dist/\' by default)')
    .on('command:*', () => {
      console.error('Invalid command: %s\nSee --help for a list of available commands.', commander.args.join(' '));
      process.exit(1);
    })
    .on('--help', () => {
      console.log('');
      console.log('More information:');
      console.log('- https://manual.os-js.org/v3/guide/cli/');
    });

  const defaults = createOptions(opts);
  const loadFile = path.resolve(defaults.cli, 'index.js');
  const options = resolveOptions(defaults, load(loadFile));

  return loadTasks(DEFAULT_TASKS, options.config.tasks, options)
    .then(tasks => {
      Object.keys(tasks).forEach(name => {
        try {
          const current = commander.command(name);
          const i = tasks[name];
          const task = typeof i === 'function'
            ? {action: i}
            : i;

          if (task.options) {
            Object.keys(task.options).forEach(k => {
              current.option(k, task.options[k]);
            });
          }

          if (task.help) {
            current.on('--help', () => task.help);
          }

          current
            .description(task.description)
            .action(() => {
              const logger = consola.withTag(name);
              const started = new Date();
              const args = getopts(process.argv.slice(2));

              task.action({logger, options, args, commander, argv})
                .then(() => {
                  const diff = new Date() - started;
                  consola.success(`Finished in ${diff}ms`);
                })
                .catch(error);
            });
        } catch (e) {
          consola.warn(e);
        }
      });

      if (process.env.NODE_ENV === 'test') {
        return;
      }

      if (argv.length < 3) {
        commander.help();
        process.exit(1);
      }

      commander.parse(argv);
    })
    .catch(error);
};

module.exports = cli;
