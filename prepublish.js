var fs = require('fs-extra');
var sh = require("execSync");

var isWindows = /^win/.test(process.platform);

// Install bower components
// ------------------------
console.log('Installing bower components ...')
var result;
if (isWindows) {
    result = sh.exec("bower install");
} else {
    result = sh.exec("./node_modules/bower/bin/bower install");
}

if (result.code !== 0) {
    throw new Error('Failed to install bower components:\n' + result.stdout);
}

// Install CKEditor plugins
// ------------------------
console.log('Installing CKEditor plugins ...')

// Install the confighelper plugin by copying it to the correct location. It was downloaded by
// bower (see the "ckeditor-confighelper" dependency in bower.json), but the plugin.js file needs
// to be copied into the ckeditor plugins directory (within a 'confighelper' subdirectory, which
// also needs to be created).
var destinationDir = 'client/vendor/ckeditor/plugins/confighelper';
if (!fs.existsSync(destinationDir)) { fs.mkdirSync(destinationDir); }
fs.copySync('client/vendor/ckeditor-confighelper/plugin.js', destinationDir + '/plugin.js');
