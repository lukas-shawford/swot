module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        env: {
            dev: {
                // Environment variables for dev configuration
                PORT: 3000,
                MONGODB_URL: 'localhost:27017/swot'
            },
            prod: {
                // Environment variables for running in production
                PORT: 80
                // TODO: Create a secrets file, and load things like the MongoLab URL and the cookie
                // secret from there. Keep that file out of version control.
            },
            test: {
                // Environment variables for end-to-end tests
                PORT: 3033,
                MONGODB_URL: 'localhost:27017/swot_test'
            }
        },
        shell: {
            app: {
                // Launch the application
                command: "node app.js"
            },
            'app-background' : {
                // Launch the application in the background
                command: "node app.js",
                options: {
                    async: true
                }
            },
            mocha: {
                // Run mocha unit tests
                command: "mocha test/unit"
            },
            'webdriver-manager': {
                // Start selenium server (used for end-to-end tests)
                command: "webdriver-manager start",
                options: {
                    async: true
                }
            },
            protractor: {
                // Launch protractor (end-to-end test runner for AngularJS - requires selenium to be running)
                command: "protractor e2e.conf.js"
            },
            options: {
                stdout: true,
                stderr: true,
                failOnError: false
            }
        }
    });

    // Plugins
    // -------

    grunt.loadNpmTasks('grunt-env');
    grunt.loadNpmTasks('grunt-shell-spawn');

    // Tasks
    // -----

    // Utility task for waiting a specified number of seconds (e.g., "wait:3" waits for 3 seconds).
    // Workaround for waiting for background processes to actually launch before continuing on to
    // the next task, which may depend on the background process.
    grunt.registerTask('wait', function() {
        var done = this.async();
        var seconds = parseInt(this.args[0], 10);
        if (isNaN(seconds)) { seconds = 1; }
        setTimeout(function () {
            done(true);
        }, 1000 * seconds);
    });

    grunt.registerTask('default',
        'Launches the application with a dev config.',
        ['env:dev', 'shell:app']);

    grunt.registerTask('test:unit',
        'Runs unit tests',
        ['env:test', 'shell:mocha']);

    grunt.registerTask('test:e2e',
        'Runs end-to-end tests',
        [
            'env:test',
            'shell:app-background',
            'shell:webdriver-manager',
            'wait:3',                   // Wait for selenium server to start before proceeding
            'shell:protractor',

            // Cleanup
            'shell:app-background:kill',
            'shell:webdriver-manager:kill'
        ]);

    grunt.registerTask('test',
        'Runs unit tests only (use test:e2e to run end-to-end tests, or test:all to run both unit tests and end-to-end tests)',
        ['test:unit']);

    grunt.registerTask('test:all',
        'Runs unit tests and end-to-end tests',
        ['test:unit', 'test:e2e']);

    grunt.registerTask('test:cleanup',
        'Performs cleanup after running end-to-end tests (kills the app and stops selenium server)',
        ['shell:cleanup']);

};
