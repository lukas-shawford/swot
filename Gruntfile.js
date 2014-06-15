module.exports = function(grunt) {

    // Keep track of protractor (end-to-end test runner) exit code. If it's anything other than 0,
    // we want to suppress the "Done, without errors" message that grunt emits upon finishing all
    // the tasks.
    var protractorExitCode = null;

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

        // Use nodemon for development to automatically restart the server if any files are changed.
        // TODO: Reorganize directory structure so that all server files are in a 'server' subdirectory.
        // Then, specify a 'watch' filter below. This way, we don't unnecessarily restart the server when
        // client-side files are changed.
        nodemon: {
            dev: {
                script: 'server.js',
                options: {
                    env: {
                        PORT: 3000,
                        MONGODB_URL: 'localhost:27017/swot'
                    }
                }
            }
        },

        mochaTest: {
            test: {
                src: ['test/unit/**/*.js']
            }
        },

        shell: {

            // Launch the application
            app: {
                command: "node server.js"
            },

            // Launch the application in the background
            'app-background' : {
                command: "node server.js",
                options: {
                    async: true
                }
            },

            // Start selenium server (used for end-to-end tests)
            'webdriver-manager': {
                command: "webdriver-manager start",
                options: {
                    async: true
                }
            },

            // Launch protractor (end-to-end test runner for AngularJS - requires selenium to be running)
            protractor: {
                command: "protractor e2e.conf.js",
                options: {
                    callback: function(code, out, err, cb) {
                        protractorExitCode = code;
                        cb();
                    }
                }
            },

            // Hacky workaround for killing the test app and stopping selenium server, if for some
            // reason they remain running after executing the tests. Just run this command a couple
            // times: grunt shell:cleanup
            cleanup: {
                command: [
                    // If the app is running as an orphaned process, just trying to connect to it
                    // should be enough to make it crash, thereby stopping it.
                    'curl localhost:3033',

                    // If selenium is still running, this command tells it to shut down. It will
                    // respond with "OKOK" if it was running.
                    'curl localhost:4444/selenium-server/driver/?cmd=shutDownSeleniumServer'
                ].join('&')
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

    grunt.loadNpmTasks('grunt-mocha-test');
    grunt.loadNpmTasks('grunt-env');
    grunt.loadNpmTasks('grunt-shell-spawn');
    grunt.loadNpmTasks('grunt-nodemon');

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

    // This task simply suppresses the default "Done, without errors" message that grunt emits upon
    // finishing all the tasks if protractor exited with a non-zero exit code, which happens if
    // there are any failing tests.
    grunt.registerTask('e2e-report', function () {
        if (protractorExitCode !== 0) {
            grunt.warn('Protractor exited with a non-zero exit code (' + protractorExitCode + '). ' +
                'Check the output above for any failing tests.');
        }
    });

    grunt.registerTask('default',
        'Launches the application with a dev config.',
        ['env:dev', 'shell:app']);

    grunt.registerTask('test:unit',
        'Runs unit tests',
        ['env:test', 'mochaTest']);

    grunt.registerTask('test:e2e',
        'Runs end-to-end tests',
        [
            'env:test',
            'shell:app-background',
            'shell:webdriver-manager',
            'wait:4',                   // Wait for selenium server to start before proceeding
            'shell:protractor',

            // Cleanup
            'shell:app-background:kill',
            'shell:webdriver-manager:kill',

            // Suppress "Done, without errors" message if there are failing tests
            'e2e-report'
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
