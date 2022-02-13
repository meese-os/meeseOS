const logger = require('consola');

jest.spyOn(console, 'info')
  .mockImplementation(() => {});

jest.spyOn(console, 'log')
  .mockImplementation(() => {});

jest.spyOn(process, 'exit')
  .mockImplementation(() => {});

logger.mockTypes(() => jest.fn());
