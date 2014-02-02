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
            cleanup: {
                // Workaround for killing the app and stopping selenium server after finishing
                // running end-to-end tests.
                //
                // It appears that the child processes shell:app and shell:webdriver-manager continue
                // running, even after grunt has finished. (This is contrary to what the documentation
                // for grunt-shell-spawn claims.) As a result, without this cleanup, the test:e2e task
                // would successfully run once, but if you were to try to run it again, you would get
                // errors because the app port and the selenium webdriver ports (3033 and 4444,
                // respectively) are still in use.
                // 
                // The app can be killed using kill, or the Task Manager (in Windows), or by simply
                // navigating to localhost:3033 (if you try to connect to the app using curl, or a
                // browser, it will redirect you to the login page, indicating that the app is indeed
                // still running, but apparently the app isn't fully functional since it will prompty
                // die at that point).
                //
                // As for selenium, it can also be killed using kill or Task Manager, or by just sending
                // an HTTP GET request (using curl or a browser) to:
                // http://localhost:4444/selenium-server/driver/?cmd=shutDownSeleniumServer
                //
                // This should respond with "OKOK", indicating that selenium was in fact still running.
                //
                // As a workaround for these issues, this task simply runs the following commands:
                //     curl localhost:3033
                //     curl http://localhost:4444/selenium-server/driver/?cmd=shutDownSeleniumServer
                //
                // This will effectively kill the app and selenium, making it possible to run the tests
                // again.
                // 
                // Unfortunately, there's another issue with grunt-shell-spawn. If running on Windows,
                // it will convert any forward slashes in the command to backslashes (since it assumes
                // all slashes are part of a path, and Windows paths require backslashes). There seems
                // to be no way to disable this behavior. This is problematic for the second command
                // which shuts down selenium server - the forward slashes in the URL should *NOT* be
                // converted to backslashes. This issue with grunt-shell-spawn is documented here:
                //
                // https://github.com/cri5ti/grunt-shell-spawn/issues/12
                //
                // Until it is fixed in the actual package, this feature simply needs to be disabled
                // manually by editing node_modules/grunt-shell-spawn/tasks/shell.js. On line 53,
                // get rid of the call to replace:
                //
                //      args = ['/s', '/c', data.command.replace(/\//g, '\\') ];
                //
                // That line should just be:
                //
                //      args = ['/s', '/c', data.command ];
                //
                // This entire workaround assumes that curl is installed. Note that on Windows, curl
                // is included in the 'gow' package:
                //
                //      https://github.com/bmatzelle/gow/wiki
                //
                // This effectively makes curl (or gow) a dependency, at least for running end-to-end
                // tests.
                command: [
                    'curl localhost:3033',
                    'curl localhost:4444/selenium-server/driver/?cmd=shutDownSeleniumServer'
                ].join('&')
            },
            options: {
                stdout: true,
                stderr: true,
                failOnError: true
            }
        }
    });

    // Plugins
    // -------

    grunt.loadNpmTasks('grunt-env');
    grunt.loadNpmTasks('grunt-shell-spawn');

    // Tasks
    // -----

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
            'shell:protractor',

            // Hacky workaround for killing zombie processes - see long comment above.
            // It's sometimes necessary to run this multiple times before it works:
            'test:cleanup'

            // Another workaround is to kill the processes using the :kill target, but this doesn't work on Windows.
            //'shell:app-background:kill',      
            //'shell:webdriver-manager:kill'
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
