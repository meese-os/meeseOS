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
const utils = require('../utils.js');
const path = require('path');
const fs = require('fs-extra');

const isSymlink = file => fs.lstat(file)
  .then(stat => stat.isSymbolicLink());

const glob = async (dir) => {
  const stat = async (f) => {
    const d = path.resolve(dir, f);

    try {
      const s = await fs.lstat(d);
      if (s.isSymbolicLink() || s.isDirectory()) {
        return d;
      }
    } catch (e) {
      console.warn(e);
    }

    return null;
  };

  const files = await fs.readdir(dir);
  const result = await Promise.all(files.map(stat));
  return result.filter(f => !!f);
};

const clean = async (copyFiles, dir) => glob(dir)
  .then(files => Promise.all(files.map(file => {
    return isSymlink(file)
      .then(sym => {
        return (sym ? fs.unlink(file) : fs.remove(file))
          .catch(err => {
            console.warn(err);
          });
      });
  })));

const getAllPackages = async (logger, dirs) => {
  const result = [];
  for (let i = 0; i < dirs.length; i++) {
    result.push(await utils.npmPackages(dirs[i]));
  }

  const packages = [];
  const exists = name => packages
    .find(iter => iter.meta.name === name);

  for (let i = result.length - 1; i >= 0; i--) {
    const group = result[i];
    for (let j = 0; j < group.length; j++) {
      if (!exists(group[j].meta.name)) {
        packages.push(group[j]);
      }
    }
  }

  return packages;
};

const removeSoftDeleted = (logger, disabled) => iter => {
  if (disabled.indexOf(iter.meta.name) !== -1) {
    logger.warn(iter.meta.name, 'was disabled by config');
    return false;
  }

  if (iter.filename.toLowerCase().match(/\.disabled$/)) {
    logger.warn(iter.meta.name, 'was disabled by directory suffix');
    return false;
  }

  if (iter.meta.disabled === true) {
    logger.warn(iter.meta.name, 'was disabled in metadata');
    return false;
  }

  return true;
};

const action = async ({logger, options, args, commander}) => {
  const dist = options.dist();
  const copyFiles = args.copy === true;
  const relativeSymlinks = !copyFiles && args.relative === true;
  const discoveryDest = path.resolve(args.discover || options.packages);

  logger.info('Discovering packages...');
  logger.info('Destination discovery map', discoveryDest);
  logger.info('Destination path', dist.root);
  logger.info('Destination manifest', dist.metadata);

  options.config.discover.forEach(d => logger.info('Including', d));

  const found = await getAllPackages(logger, options.config.discover);

  const packages = found
    .filter(removeSoftDeleted(logger, options.config.disabled));

  const discovery = packages.map(pkg => pkg.filename)
    .map(filename => path.relative(options.root, filename));

  const manifest = packages.map(({meta}) => {
    const override = options.config.metadata
      ? options.config.metadata.override[meta.name]
      : null;

    if (override) {
      logger.warn(`Metadata for '${meta.name}' was overridden from CLI config!`);
    }

    return Object.assign({}, meta, override || {});
  });

  const roots = {
    theme: dist.themes,
    icons: dist.icons,
    sounds: dist.sounds
  };

  const discover = () => packages.map(pkg => {
    const d = roots[pkg.meta.type]
      ? path.resolve(roots[pkg.meta.type], pkg.meta.name)
      : path.resolve(dist.packages, pkg.meta.name);

    let s = path.resolve(pkg.filename, 'dist');
    if (relativeSymlinks) {
      s = path.relative(options.root, s);
    }

    return fs.ensureDir(s)
      .then(() => {
        return copyFiles
          ? fs.copy(s, d)
          : fs.ensureSymlink(s, d, 'junction');
      })
      .catch(err => console.warn(err));
  });

  packages.forEach(pkg => {
    const type = pkg.filename.match(/node_modules/) ? 'npm' : 'local';
    const method = copyFiles ? 'copy' : 'symlink';
    logger.log(`- ${pkg.json.name} as ${pkg.meta.name} [${method}, ${type}]`);
  });


  logger.info('Flushing out old discoveries...');

  await fs.ensureDir(dist.root);
  await fs.ensureDir(dist.themes);
  await fs.ensureDir(dist.packages);
  await clean(copyFiles, dist.themes);
  await clean(copyFiles, dist.packages);

  logger.info('Placing packages in dist...');

  await Promise.all(discover());
  await fs.writeJson(discoveryDest, discovery);
  await fs.writeJson(dist.metadata, manifest);

  logger.success(packages.length + ' package(s) discovered.');
};

module.exports = {
  'package:discover': {
    description: 'Discovers all installed OS.js packages',
    options: {
      '--copy': 'Copy files instead of creating symlinks',
      '--relative': 'Use relative paths for symlinks',
      '--discover [discover]': 'Discovery output file (\'packages.json\' by default)'
    },
    action
  },
};
