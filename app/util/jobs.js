
/*!
 * Module dependencies
 */


var Order = require('../models/order');
var Support = require('../models/support');
var mailer = require('./mailer')

// Sends order confirmation emails
// exports.OrderConfirmationEmail = function() {
//
// 	//console.log('_jobOrderConfirmationEmail started');
//
// 	// Stop calling this job until we finish
// 	this.stop();
//
// 	// Results
// 	var orders = [];
//
// 	common.async.series([
//
// 		// 1. Get Orders where Client hasn't been notified
// 		function(callback) {
//
// 			Order
//       .find({
// 				status: Order.OrderStatus.Submitted,
// 				sent_email: false
// 			})
// 			.limit(10)
// 			.sort({_id:1})
// 			.populate('client')
// 			.populate('address')
// 			.exec(function(err, docs) {
// 				if (!err && docs) {
// 					orders = docs;
// 				};
// 				console.log(util.format('OrderConfirmationEmail => got %d order for confirmation email', orders.length));
// 				callback(null, 'got orders');
// 			});
// 		}
// 	],
// 	// Finally.
// 	function(err, results) {
// 		// Send notifications
// 		common.async.eachLimit(orders, 5, function(order, callback) {
//
// 			// template locals
// 			var today = new Date();
// 			var locals = {
// 				order_id: order._id,
// 				photos_qty: order.photo_count,
// 				cost_printing: order.cost_printing,
// 				cost_shipping: order.cost_shipping,
// 				cost_total: order.cost_total,
// 				address_to_name: util.format('%s %s', order.address.name, order.address.last_name),
// 				address: util.format('%s %s %s %s %s', order.address.address_line1, order.address.address_line2, order.address.comuna, order.address.provincia, order.address.region),
// 				current_year: today.getFullYear()
// 			}
//
//
//
// 			var subject = util.format('ThePrintlab: Confirmación de Pedido (%s)', order._id);
// 			var bcc = config.admin_emails.join(', ');
//
//
// 			mailer.send('order_confirm', locals, 'ThePrintlab <orders@theprintlab.cl>', order.client.email, bcc, subject, function(err, response) {
// 				if(err) {
// 					console.log(util.format('Error sending order_confirm for order %s => %s', order._id, err));
// 				}
//
// 				// mark as sent
// 				order.sent_email = true;
// 				order.save(function(err, saved) {
// 					callback(null);
// 				});
//
// 			});
// 		}, function(err) {
// 			// Done!
// 			//console.log('_jobOrderEmalNotification finished');
// 		});
//
// 	});
// }

// Sends support emails
// exports.SupportNotificationEmail = function() {
//
//
// 	// Stop calling this job until we finish
// 	this.stop();
//
// 	// Results
// 	var supports = [];
//
// 	common.async.series([
//
// 		// Get Supports
// 		function(callback) {
//
// 			Support
//       .find({
// 				status: Support.Status.New
// 			})
// 			.limit(10)
// 			.sort({_id:1})
// 			.populate('client')
// 			.exec(function(err, docs) {
// 				if (!err && docs) {
// 					supports = docs;
// 				};
// 				console.log(util.format('SupportNotificationEmail => got %d supports for notification email', supports.length));
// 				callback(null, 'got orders');
// 			});
// 		}
// 	],
// 	// Finally.
// 	function(err, results) {
// 		// Send notifications
// 		async.eachLimit(supports, 5, function(support, callback) {
//
// 			//template locals
// 			var today = new Date();
// 			var locals = {
// 				client_id: support.client._id,
// 				support_id: support._id,
// 				message: support.message,
// 				email: support.client.email,
// 				mobile: support.client.mobile,
// 				date: plutil.mongoIdToPrettyDate(support._id),
// 				current_year: today.getFullYear()
// 			}
//
// 			var subject = util.format('[ThePrintlab Support] (%s)', support._id);
// 			var bcc = config.admin_emails.join(', ');
// 			mailer.send('support', locals, 'fluxa@theprintlab.cl', 'hola@theprintlab.cl', bcc, subject, function(err, response) {
// 				if(err) {
// 					console.log(util.format('Error sending support => %s', support._id, err));
// 				}
//
// 				// mark as Open
// 				support.status = Support.Status.Open;
// 				support.save(function(err, saved) {
// 					callback(null);
// 				});
// 			});
// 		}, function(err) {
// 			// Done!
// 			//console.log('SupportNotificationEmail finished');
// 		});
//
// 	});
// }

// Sends bank transfer order emails
// exports.OrderBankTransferEmail = function() {
//
//
//   // Stop calling this job until we finish
//   this.stop();
//
//   // Results
//   var orders = [];
//
//   common.async.series([
//
//     // Get Orders where Client hasn't been notified
//     function(callback) {
//
//       Order
//       .find({
//         status: Order.OrderStatus.PaymentOffline,
//         sent_bank_transfer_email: false
//       })
//       .limit(10)
//       .sort({_id:1})
//       .populate('client')
//       .populate('address')
//       .exec(function(err, docs) {
//         if (!err && docs) {
//           orders = docs;
//         };
//         console.log(util.format('OrderBankTransferEmail => got %d orders for bank transfer email', orders.length));
//         callback(null, 'got orders');
//       });
//     }
//   ],
//   // Finally.
//   function(err, results) {
//     // Send notifications
//     common.async.eachLimit(orders, 3, function(order, callback) {
//
//       // template locals
//       var today = new Date();
//       var locals = {
//         order_id: order._id,
//         photos_qty: order.photo_count,
//         cost_printing: order.cost_printing,
//         cost_shipping: order.cost_shipping,
//         cost_total: order.cost_total,
//         address_to_name: util.format('%s %s', order.address.name, order.address.last_name),
//         address: util.format('%s %s %s %s %s', order.address.address_line1, order.address.address_line2, order.address.comuna, order.address.provincia, order.address.region),
//         current_year: today.getFullYear(),
//         confirm_payment_url: util.format('http://www.theprintlab.cl/bktrans?order_id=%s&env=%s',order._id,common.env)
//       }
//
//       var subject = util.format('ThePrintlab: Pedido Recibido (%s)', order._id);
//       var bcc = config.admin_emails.join(', ');
//       mailer.send('order_bank_transfer', locals, 'ThePrintlab <orders@theprintlab.cl>', order.client.email, bcc, subject, function(err, response) {
//         if(err) {
//           console.log('Error sending order received bank transfer for order %s => %s', order._id, err);
//         } else {
//           console.log('OrderBankTransferEmail response => %s',response);
//         }
//
//         // mark as sent
//         order.sent_bank_transfer_email = true;
//         order.save(function(err, saved) {
//           callback(null);
//         });
//
//       });
//     }, function(err) {
//       // Done!
//       //console.log('_jobOrderEmalNotification finished');
//     });
//
//   });
// }
