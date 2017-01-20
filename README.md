# swot

Quiz maker written using the MEAN stack (MongoDB, Express, AngularJS, and Node.js). This is a learning project that is still in the early stages of development.

The primary goal of swot is to create an advanced quiz editor that is capable of more than just simple flashcard style questions, while keeping the UI simple and easy to use.

Current capabilities include:

- Ability to create, save and take quizzes
- Rich formatting in the questions (support for font styles, lists, images, etc. all courtesy of [ckeditor](http://ckeditor.com/))
- Navigate and take quizzes with instant feedback and automatic score-keeping
- Support for multiple question types, including fill-in and multiple choice

Support for a greater variety of question types including true/false, short answer, matching, check all that apply, and others - along with more grading options and the ability to show supplemental information - is all coming soon.

### Launching

swot requires [Node](http://nodejs.org/) and [npm](http://npmjs.org/) (which should be installed as part of Node), and can be built and launched on UNIX platforms as well as Windows.

In addition, [MongoDB](http://www.mongodb.org/) should be installed and running.  swot assumes that MongoDB is listening on the default port, 27017, but this may be changed by setting the `MONGODB_URL` environment variable before launching the app (if the environment variable is not specified, it defaults to `localhost:27017/swot`).

Finally, you must also have [grunt](http://gruntjs.com/) installed globally:

```
npm install -g grunt-cli
```

Once these prerequisites are met, building and launching swot should be fairly simple. After cloning the repo, switch to the directory in the terminal or command line and run the following commands:

    npm install
    npm start

The app should now be running on port 3000.  You should be able to connect to http://localhost:3000 using the browser and see a login screen (there isn't really an actual home page yet). Click register at the top right and create an account, after which you should be able to create and take quizzes.

**Note:** During development, you can instead run `grunt nodemon` to launch the app using [nodemon](https://github.com/remy/nodemon). This will automatically restart the server whenever any files are changed.


### Running Tests

swot uses the following testing frameworks:

- [mocha](http://mochajs.org/): Test runner.
- [chai](http://chaijs.com/): Assertion library. swot uses [BDD style](http://chaijs.com/api/bdd/) assertions using `expect`.
- [sinon](): Mock/stub framework.
- [Protractor](https://github.com/angular/protractor): Framework for writing end-to-end (e2e) tests.

To run the unit tests, you will need to have mocha installed globally: `npm install -g mocha`. Then the tests may be run using `grunt test`.

To run the end-to-end tests, you will need to have Protractor installed globally:

    npm install -g protractor

Then you will need to install the selenium standalone server. Protractor comes with a script to help download and install it - run the following command to do so (use sudo on Linux):

    webdriver-manager update

After completing the above setup, you should be able to run the end-to-end tests using grunt:

    grunt test:e2e

The `test:e2e` task is a shortcut that essentially runs all of the following commands:

- Launches the app with a testing configuration (make it run on port 3033 instead of the default 3000, and have it connect to a separate database called `swot_test` instead of `swot`):  
  `grunt env:test shell:app`
- Starts selenium server:  
  `webdriver-manager start`
- Runs protractor:  
  `protractor e2e.conf.js`

While doing development, it is recommended to run each of the above commands in 3 separate terminals.  This way, you're not repeatedly launching and bringing down the app, as well as selenium server, without need (rather, you can restart the app only if you've made any server-side changes, and you can probably just leave selenium running all the time). It also keeps the output from running the tests separate, instead of mixing it all in one place.  However, if you just want to just run the tests once, quickly, then this can save a lot of time and remembering.

Note also that the end-to-end tests can take several minutes to run. If you're doing work on the quiz editor, it's unlikely that you broke anything related to the login/registration functionality, so you may want to save some time by skipping these tests. To do this, you can temporarily edit the file filter in [`e2e.conf.js`](https://github.com/sergkr/swot/blob/master/e2e.conf.js) by changing this line:

    specs: ['test/e2e/**/*.spec.js'],

To this (for example):

    specs: ['test/e2e/editQuiz/*.spec.js'],

This way, you will only be running the quiz editor specs when launching protractor.

Finally, note that there's another shortcut task in grunt that allows you to run both the unit tests as well as end-to-end tests using one command:

`grunt test:all`

This runs the unit tests, followed by the end-to-end tests.
