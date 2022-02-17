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

import {Graph, Node} from 'async-dependency-graph';

export const resolveTreeByKey = (tree, key, defaultValue) => {
  let result;

  try {
    result = key
      .split(/\./g)
      .reduce((result, key) => result[key], Object.assign({}, tree));
  } catch (e) { /* noop */ }

  return typeof result === 'undefined' ? defaultValue : result;
};

const each = (list, method) => Promise.all(list.map(p => {
  try {
    return p.provider[method]();
  } catch (e) {
    return Promise.reject(e);
  }
}))
  .catch(err => console.warn(err));

export const providerHandler = (core) => {
  let instances = {};
  let providers = [];
  let registry = [];

  const createGraph = (list, method) => {
    const graph = new Graph();
    const provides = list.map(p => typeof p.provider.provides === 'function' ? p.provider.provides() : []);
    const dependsOnIndex = wants => provides.findIndex(arr => arr.some(a => wants.indexOf(a) !== -1));

    list.forEach((p, i) => {
      graph.addNode(new Node(String(i), () => {
        try {
          return Promise.resolve(p.provider[method]());
        } catch (e) {
          return Promise.reject(e);
        }
      }));
    });

    list.forEach((p, i) => {
      const dependsOptions = p.options.depends instanceof Array
        ? p.options.depends
        : [];

      const dependsInstance = typeof p.provider.depends === 'function'
        ? p.provider.depends()
        : [];

      const depends = [...dependsOptions, ...dependsInstance];
      if (depends.length > 0) {
        const dindex = dependsOnIndex(depends);
        if (dindex !== -1) {
          graph.addDependency(String(i), String(dindex));
        }
      }
    });

    return graph.traverse()
      .catch(e => console.warn(e));
  };

  const handle = list => createGraph(list, 'init')
    .then(() => createGraph(list, 'start'));


  const has = name => registry.findIndex(p => p.name === name) !== -1;

  const destroy = () => {
    const result = each(providers, 'destroy');

    instances = {};
    registry = [];

    return result;
  };

  const init = (before) =>
    handle(before
      ? providers.filter(p => p.options.before)
      : providers.filter(p => !p.options.before));

  const register = (ref, options) => {
    try {
      providers.push({
        provider: new ref(core, options.args),
        options
      });
    } catch (e) {
      console.error('Provider register error', e);
    }
  };

  const bind = (name, singleton, callback) => {
    core.logger.info('Provider binding', name);

    registry.push({
      singleton,
      name,
      make(...args) {
        return callback(...args);
      }
    });
  };

  const make = (name, ...args) => {
    const found = registry.find(p => p.name === name);
    if (!found) {
      throw new Error(`Provider '${name}' not found`);
    }

    if (!found.singleton) {
      return found.make(...args);
    }

    if (!instances[name]) {
      if (found) {
        instances[name] = found.make(...args);
      }
    }

    return instances[name];
  };

  return {register, init, bind, has, make, destroy};
};
