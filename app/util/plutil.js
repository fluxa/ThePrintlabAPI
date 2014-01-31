/*!
 * Module dependencies.
 */

var moment = require('moment');

exports.mongoIdToPrettyDate = function(_id) {
 	var timehex = String(_id).substring(0,8);
	var secondsSinceEpoch = parseInt(timehex, 16);
	var timestamp = (secondsSinceEpoch*1000);
	return new moment(timestamp).format('YYYY-MM-DD HH:mm');
}