
/*!
 * Module dependencies
 */

var async = require('async');
var util = require('util');
var Order = require('../models/order');
var Support = require('../models/support');
var mailer = require('./mailer')
var _ = require('underscore')
var config =  require('../../config/config')[process.env.NODE_ENV];
var plutil = require('./plutil');

// Daily updates
exports.OrderConfirmationEmail = function() {
	
	//console.log('_jobOrderConfirmationEmail started');

	// Stop calling this job until we finish
	this.stop();

	// Results
	var orders = [];

	async.series([

		// 1. Get Orders where Client hasn't been notified
		function(callback) {
			
			Order.find({
				status: Order.OrderStatus.Submitted,
				sent_email: false
			})
			.limit(10)
			.sort({_id:1})
			.populate('client')
			.populate('address')
			.exec(function(err, docs) {
				if (!err && docs) {
					orders = docs;
				};
				console.log(util.format('OrderConfirmationEmail => got %d order for confirmation email', orders.length));
				callback(null, 'got orders');
			});
		}
	],
	// Finally.
	function(err, results) {
		// Send notifications
		async.eachLimit(orders, 5, function(order, callback) {

			// template locals
			var today = new Date();
			var locals = {
				order_id: order._id,
				photos_qty: order.photo_count,
				cost_printing: order.cost_printing,
				cost_shipping: order.cost_shipping,
				cost_total: order.cost_total,
				address_to_name: util.format('%s %s', order.address.name, order.address.last_name),
				address: util.format('%s %s %s %s %s', order.address.address_line1, order.address.address_line2, order.address.comuna, order.address.provincia, order.address.region),
				current_year: today.getFullYear()
			}

			var subject = util.format('ThePrintlab: Confirmación de Pedido (%s)', order._id);
			var bcc = 'luis@theprintlab.cl, fluxa@theprintlab.cl';
			mailer.send('order_confirm', locals, 'ThePrintlab <orders@theprintlab.cl>', order.client.email, bcc, subject, function(err, response) {
				if(err) {
					console.log(util.format('Error sending order_confirm for order %s => %s', order._id, err));
				}

				// mark as sent
				order.sent_email = true;
				order.save(function(err, saved) {
					callback(null);
				});

			});
		}, function(err) {
			// Done!
			//console.log('_jobOrderEmalNotification finished');
		});
		
	});
}

// Sends 
exports.SupportNotificationEmail = function() {
	
	
	// Stop calling this job until we finish
	this.stop();

	// Results
	var supports = [];

	async.series([

		// Get Supports 
		function(callback) {
			
			Support.find({
				status: Support.Status.New
			})
			.limit(10)
			.sort({_id:1})
			.populate('client')
			.exec(function(err, docs) {
				if (!err && docs) {
					supports = docs;
				};
				console.log(util.format('SupportNotificationEmail => got %d supports for notification email', supports.length));
				callback(null, 'got orders');
			});
		}
	],
	// Finally.
	function(err, results) {
		// Send notifications
		async.eachLimit(supports, 5, function(support, callback) {

			//template locals
			var today = new Date();
			var locals = {
				client_id: support.client._id,
				support_id: support._id,
				message: support.message,
				email: support.client.email,
				mobile: support.client.mobile,
				date: plutil.mongoIdToPrettyDate(support._id),
				current_year: today.getFullYear()
			}

			var subject = util.format('[ThePrintlab Support] (%s)', support._id);
			var bcc = 'luis@theprintlab.cl, fluxa@theprintlab.cl';
			mailer.send('support', locals, 'fluxa@theprintlab.cl', 'hola@theprintlab.cl', bcc, subject, function(err, response) {
				if(err) {
					console.log(util.format('Error sending support => %s', support._id, err));
				}

				// mark as Open
				support.status = Support.Status.Open;
				support.save(function(err, saved) {
					callback(null);
				});
			});
		}, function(err) {
			// Done!
			//console.log('SupportNotificationEmail finished');
		});
		
	});
}