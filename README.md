# swot

Quiz maker written using the MEAN stack (MongoDB, Express, AngularJS, and Node.js). This is a learning project that is still in the early stages of development.

The primary goal of swot is to create an advanced quiz editor that is capable of more than just simple flashcard style questions, which keeping the UI simple and easy to use.

Current capabilities are fairly basic at this point, but include the ability to create and save quizzes with rich formatting in the questions (courtesy of [ckeditor](http://ckeditor.com/)), as well as to take quizzes (with automatic score keeping). Currently, only short-answer style questions are supported - other question types including fill-in, multiple choice, and self-graded long response questions are coming soon.

### Launching

swot requires [Node](http://nodejs.org/) and [npm](http://npmjs.org/) (which should be installed as part of Node), and can be built and launched on UNIX platforms as well as Windows.

In addition to Node, swot requires [bower](http://bower.io/) to be installed globally:

```
npm install -g bower
```

Finally, [MongoDB](http://www.mongodb.org/) should be installed and running. By default, it is assumed that MongoDB is listening on port 27017 (though this may be changed by setting the `MONGODB_URL` environment variable before launching the app - the default if the environment variable is missing is `localhost:27017/swot`).

Once these prerequisites are met, building and launching swot should be fairly simple. After cloning the repo, switch to the directory in the terminal or command line and run the following commands:

    npm install
    npm start

The app should now be running on port 3000.  You should be able to connect to http://localhost:3000 using the browser and see a login screen (there isn't really an actual home page yet). Click register at the top right and create an account, after which you should be able to create and take quizzes.


### Running Tests

swot uses the following testing frameworks:

- [mocha](http://visionmedia.github.io/mocha/): Test runner.
- [chai](http://chaijs.com/): Assertion library. swot uses [BDD style](http://chaijs.com/api/bdd/) assertions.
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

While doing development, it is recommended to run each of the above commands in 3 separate terminals.  This way, you're not repeatedly launching and bringing down the app all the time, as well as selenium server. It also keeps the output from running the tests separate, instead of mixing it all in one place.  However, if you just want to just run the tests once, quickly, then this can save a lot of time and remembering.

Finally, you can run both the unit tests as well as end-to-end tests using one command:

`grunt test:all`

This runs the unit tests, followed by the end-to-end tests.
