const logger = require('consola');
const path = require('path');
const temp = require('temp');
const fs = require('fs-extra');
const utils = require('../../src/utils.js');
const task = require('../../src/tasks/scaffold.js');

describe('task > make:*', () => {
  const root = temp.mkdirSync('meese-cli-jest');
  const fname = str => path.resolve(root, str);

  const defaults = utils.createOptions({root});

  const options =  utils.resolveOptions(defaults, {
    discover: [
      path.resolve(__dirname, '../../__mocks__/packages')
    ]
  });

  const runTask = (name, args = {}) => task[name]
    .action({
      logger,
      options,
      args,
      commander: null
    });

  const basicScaffold = async (name, type) => {
    const filename = `my-${name}.js`;
    await runTask(`make:${name}`, {type, filename});

    return fs.existsSync(fname(`src/${type}/${filename}`));
  };

  afterAll(() => fs.removeSync(root));

  describe('make:auth', () => {
    test('should create client auth adapter', () => {
      return expect(basicScaffold('auth', 'client'))
        .resolves
        .toBe(true);
    });

    test('should create server auth adapter', async () => {
      return expect(basicScaffold('auth', 'server'))
        .resolves
        .toBe(true);
    });

    test('should fail when exists', async () => {
      return expect(basicScaffold('auth', 'server'))
        .rejects
        .toBeInstanceOf(Error);
    });
  });

  describe('make:settings', () => {
    test('should create client settings adapter', () => {
      return expect(basicScaffold('settings', 'client'))
        .resolves
        .toBe(true);
    });

    test('should create server settings adapter', async () => {
      return expect(basicScaffold('settings', 'server'))
        .resolves
        .toBe(true);
    });
  });

  describe('make:provider', () => {
    test('should create client provider adapter', () => {
      return expect(basicScaffold('provider', 'client'))
        .resolves
        .toBe(true);
    });

    test('should create server provider adapter', async () => {
      return expect(basicScaffold('provider', 'server'))
        .resolves
        .toBe(true);
    });
  });

  describe('make:vfs', () => {
    test('should create client vfs adapter', () => {
      return expect(basicScaffold('vfs', 'client'))
        .resolves
        .toBe(true);
    });

    test('should create server vfs adapter', async () => {
      return expect(basicScaffold('vfs', 'server'))
        .resolves
        .toBe(true);
    });
  });

  describe('make:application', () => {
    test('should create application', async () => {
      await runTask('make:application', {
        dry: true,
        force: true,
        name: 'StandardApplication',
        target: 'src/packages/StandardApplication'
      });

      expect(fs.readdirSync(fname('src/packages/StandardApplication')))
        .toHaveLength(7);
    });
  });

  describe('make:iframe-application', () => {
    test('should create application', async () => {
      await runTask('make:iframe-application', {
        dry: true,
        force: true,
        name: 'IframeApplication',
        target: 'src/packages/IframeApplication'
      });

      expect(fs.readdirSync(fname('src/packages/IframeApplication')))
        .toHaveLength(6);
    });
  });
});
