const consola = require('consola');
consola.pauseLogs();

const temp = require('temp').track();
const path = require('path');
const config = require('../src/config.js');

const {
  Core,
  CoreServiceProvider,
  PackageServiceProvider,
  VFSServiceProvider,
  AuthServiceProvider,
  SettingsServiceProvider
} = require('../index.js');

module.exports = (options = {}) => {
  const tempPath = temp.mkdirSync('meeseOS-vfs');

  const meeseOS = new Core(Object.assign({
    tempPath,
    development: false,
    port: 0,
    root: __dirname,
    public: path.resolve(__dirname, 'dist'),
    vfs: {
      root: tempPath,
      watch: true
    },
    mime: {
      filenames: {
        'defined file': 'test/jest'
      }
    }
  }, config), {
    kill: false
  });

  meeseOS.configuration.vfs.mountpoints[1].attributes.chokidar = {
    persistent: false
  };
  meeseOS.configuration.vfs.mountpoints[1].attributes.watch = true;

  meeseOS.register(CoreServiceProvider, {before: true});
  meeseOS.register(PackageServiceProvider);
  meeseOS.register(VFSServiceProvider);
  meeseOS.register(AuthServiceProvider);
  meeseOS.register(SettingsServiceProvider);

  return meeseOS.boot()
    .then(() => meeseOS);
};

