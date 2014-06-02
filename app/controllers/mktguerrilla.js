/*!
 * Module dependencies.
 */

var mongoose = require('mongoose');
var Client = mongoose.model('Client');

exports.index = function(req, res) {

  res.render('mktguerrilla/index',{

  });

}
