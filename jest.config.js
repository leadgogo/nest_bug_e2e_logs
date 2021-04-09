const merge = require('deepmerge');
const base = require('../../jest.config');

module.exports = {
  ...merge(base, {
    globals: {
      'ts-jest': {
        tsconfig: 'tsconfig.test-unit.json',
      },
    },
  }),
  rootDir: 'src',
  testRegex: [/.*\.spec\.ts$/],
};
