/*!
 * Module dependencies.
 */

var mongoose = require('mongoose')
var Order = mongoose.model('Order');
var Client = mongoose.model('Client');
var async = require('async');
var _ = require('underscore');
var moment = require('moment');

/* 
* Routes
*/

exports.dashboard = function(req, res) {

	res.render('dashboard', {});

}

exports.orders = function(req, res) {

	var orders = [];

	async.series([

		// Get All Orders
		function(callback) {

			Order.find({})
			.sort({_id: -1})
			.populate('address')
			.populate('client')
			.exec(function(err, docs) {
				if(!err && docs) {
					orders = docs;
				}
				callback(null, 'orders');
			});
		}

	// Finish
	], function(err, results) {
		res.render('orders', {orders: orders, toPrettyDate: toPrettyDate});
	});
}

/*
* Utils
*/
function toPrettyDate(_id) {
	var timehex = String(_id).substring(0,8);
	var secondsSinceEpoch = parseInt(timehex, 16);
	//return new Date(secondsSinceEpoch*1000);
	return new moment(secondsSinceEpoch*1000).format('YYYY-MM-DD HH:mm');
}