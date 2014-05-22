/*!
 * Module dependencies
 */

var env = process.env.NODE_ENV || 'development'
var config = require('../../config/config')[env];


common = {
	env: env,
	util: require('util'),
	config: config,
	async: require('async'),
	_:require('underscore'),
	moment: require('moment'),
	plerr: require('./plerror'),
  mailqueue: require('./mailqueue')
}

module.exports = common;
