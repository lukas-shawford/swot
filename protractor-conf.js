// Configuration file for end-to-end tests using Protractor.
exports.config = {
  
  // The address of a running selenium server.
  seleniumAddress: 'http://localhost:4444/wd/hub',

  // The base URL of the app we're testing
  baseUrl: 'http://localhost:3000/',

  // Capabilities to be passed to the webdriver instance.
  capabilities: {
    'browserName': 'chrome'
  },

  // Spec patterns are relative to the current working directly when
  // protractor is called.
  specs: ['test/e2e/*/**/*.js'],

  // Options to be passed to Jasmine-node.
  jasmineNodeOpts: {
    showColors: true,
    defaultTimeoutInterval: 30000
  },

  /**
   * A callback function called once protractor is ready and available,
   * and before the specs are executed.
   *
   * You can specify a file containing code to run by setting onPrepare to
   * the filename string.
   */
  onPrepare: 'test/e2e/prepare.js'
};
