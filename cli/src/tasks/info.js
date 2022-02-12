const {version} = require('../../package.json');
const {inspect} = require('util');
const path = require('path');

const action = async ({logger, options, argv, commander}) => {
  const {dependencies, devDependencies} = require(
    path.resolve(options.npm)
  );

  logger.info('Dumping installation information');
  console.log(inspect({
    cli: {
      version,
      argv,
      options
    },
    commands: commander.commands
      .map(c => c._name),
    distro: {
      dependencies,
      devDependencies
    }
  }, {
    depth: null,
    compact: false,
    colors: true,
    breakLength: true
  }));
};

module.exports = {
  'info': {
    description: 'Dump installation information',
    action
  }
};
