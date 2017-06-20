
var common = require('../util/common');
var mongoose = require('mongoose');
var fs = require('fs');
mongoose.Promise = Promise;
var models = {};

exports.init = function(callback) {

  console.log('mongoose connecting to: %s',common.config.db);
  mongoose.connect(common.config.db);

  mongoose.connection.once('open', function () {
    console.log('Mongoose default connection open to ' + common.config.db);

    // Load models
    fs.readdirSync(__dirname).forEach(function (file) {
      if (~file.indexOf('.js') && file != 'index.js') {
        console.log('loaded model %s',file);
        models[file] = require(__dirname + '/' + file);
      }
    });

    module.exports = models;
    callback();
  });

  mongoose.connection.on('error',function (err) {
    console.log('Mongoose default connection error: ' + err);
  });

  mongoose.connection.on('disconnected', function () {
    console.log('Mongoose default connection disconnected');
  });

}


// If the Node process ends, close the Mongoose connection
process.on('SIGINT', function() {
  mongoose.connection.close(function () {
    console.log('Mongoose default connection disconnected through app termination');
    process.exit(0);
  });
});
