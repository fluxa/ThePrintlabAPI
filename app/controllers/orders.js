/*!
 * Module dependencies.
 */

var mongoose = require('mongoose')
var Order = mongoose.model('Order');
var Client = mongoose.model('Client');
var plerror = require('../util/plerror');
var _ = require('underscore');
var util = require('util');
var async = require('async');
 
// ### Return all posible status codes nicely formatted for using on the web-admin
// - @preturn {Array} list of all posible OrderStatus
// - @method `GET`
// - @api `private`
exports.status_list = function (req, res) {
	res.send(Order.OrderStatusList);
}

// ### Find Orders by {query:{'prop':'value'}}
// - @param {Object} query in the form {'prop':'value'}
// - @return {Array} array of Order objects
// - @method `POST`
// - @api private
exports.find = function (req, res) {

	var  query = req.body.query;
	if (query) {
		Order.find(query, function(err, docs) {
			if(!err) {
				res.send({orders:docs});
			} else {
				plerror.throw(plerror.c.DBError, err, res);
			}
		});
	} else {
		plerror.throw(plerror.c.MissingParameters, 'Missing parameters query', res);
	}
}


// ### Find all Orders return full documents for references with ObjectId
// - @return {Array} array of full Order objects
// - @method `GET`
// - @api `private`
exports.all = function (req, res) {

	Order.find({}).populate('address').populate('client').exec(function(err, docs) {
		if (!err) {
			res.send({orders: docs});
		} else {
			plerror.throw(plerror.c.DBError, err, res);
		}
	});
}


// ### Manage the Order's payment lifecycle
// - @param {String} Order _id
// - @param {String} action ( start | complete )
// - @return {Object} Order object
// - @method `POST`
// - @api `private`
exports.payment = function (req, res) {
	
	var _id = req.params['_id'];
	var action = req.params['action'];

	var order = null;
	var time_stamp = common.moment().format('YYYY-MM-DD HH:mm:ss');

	common.async.series([

		// Checks
		function(callback) {

			// check for query args
			if (_id && (_.values(Order.Actions).indexOf(action) >= 0)) {
				callback();
			} else {
				callback({code:plerror.c.MissingParameters , error:'Missing parameters _id or wrong action'});
			}

		},

		// Order
		function(callback) {
			Order
			.findOne({
				_id: _id
			})
			.exec(function(err, doc) {
				if (!err && doc) {
					order = doc;
					callback();
				} else {
					callback({code:plerror.c.OrderNotFound , error: util.format('Order not found for _id: %s',_id)});
				}
			});
		},

		// Action
		function(callback) {
			
			var err = null;

			switch(action) {

				case Order.Actions.StartWebpay:
				{
					// Check if cost_total == 0
					if (order.cost_total == 0) {
						order.status = Order.OrderStatus.NoNeedPayment;
						order.payment.provider = Order.PaymentProvider.NoPayment;
						order.payment.logs.push(util.format('%s|Payment Started => NoPayment', time_stamp));
					} else {
						// Continue with Webpay
						order.status = Order.OrderStatus.PaymentStarted;
						order.payment.provider = Order.PaymentProvider.Webpay;
						order.payment.logs.push(util.format('%s|Payment Started => Webpay', time_stamp));
					}
					break;
				}

				// TODO
				// - create payment on stripe
				// - check if saved user or token
				// - create https route (secure.theprintlab.cl)
				// - subscribe to stripe webhooks
				// - create action for no need payment (needs iOS update as well)
				// - double check Webpay still works
				case Order.Actions.StartStripe:
				{
					var stp_token = req.body.stp_token;
					if(stp_token) {
						order.status = Order.OrderStatus.PaymentStarted;
						order.payment.provider = Order.PaymentProvider.Stripe;
						order.payment.data = stp_token;
						order.payment.logs.push(util.format('%s|Payment Started => Stripe', time_stamp));
					} else {
						err = {code: plerror.c.PaymentError, error:'Stripe Payment Needs stp_token'};
						order.payment.logs.push(util.format('%s|Payment Start Stripe Error => %s', time_stamp, err.error));
					}
					
					break;
				}

				case Order.Actions.Complete:
				{
					// Check if the Order has already been Verified || Submitted
					if (_.indexOf([Order.OrderStatus.PaymentVerified, Order.OrderStatus.Submitted], order.status) === -1) {

						var payment_data = req.body.payment_data;
						
						if (payment_data) {
							
							if(order.payment.provider === Order.PaymentProvider.Webpay) {
								
								order.payment.data = payment_data;
								order.payment.logs.push(util.format('%s|Payment Complete => Webpay', time_stamp));
								order.status = Order.OrderStatus.PaymentVerified;

							} else if(order.payment.provider === Order.PaymentProvider.Stripe) {

								// TODO Verification
								order.status = Order.OrderStatus.PaymentVerified;
								order.payment.logs.push(util.format('%s|Payment Complete => Stripe', time_stamp));

							} else if(order.payment.provider === Order.PaymentProvider.NoPayment) {

								order.payment.logs.push(util.format('%s|Payment Complete => NoPayment', time_stamp));
							
							} else {
								err = {
									code: plerror.c.MissingParameters, 
									error: util.format('Cannot complete payment, unknown payment provider or data is empty => %s',payment)
								}
							}
						} else {
							err = {
								code: plerror.c.MissingParameters, 
								error: 'Cannot complete payment, missing payment data'
							}
						}

					} else {
						// TODO
						// THIS SHOULD NEVER HAPPEN, SOMETHING WENT VERY WRONG
						err = {
							code: plerror.c.CannotVerifyPayment, 
							error: 'Order is already Verified / Submitted, cannot pay twice'
						}
					}
					
					break;
				}

				case Order.Actions.Fail:
				{
					order.status = Order.OrderStatus.PaymentError;
					var payment_log = req.body.payment_log || 'unknown reason';
					if (payment_log) {
						order.payment.logs.push(util.format('%s|Payment Failed => reason: %s',time_stamp,payment_log));
					};
					break;
				}
			}

			callback(err);

		},

		// Save
		function(callback) {
			order.markModified('payment');
			order.save(function(err, saved) {
				if (!err && saved) {
					order = saved;
					callback();
				} else {
					callback({code:plerror.c.DBError , error: util.format('/order/payment/ -> Cannot save Order _id: %s',_id)});
				}
			});
		}

	],
	// Finally
	function(err) {
		if(!err) { 
			res.send({
				order: saved
			});
		} else {
			plerror.throw(err.code, err.error, res);
		}
	});

	
}

// ### Get one Order by _id
// - @return {Object} Order object
// - @method `GET`
// - @api `public`
exports.get = function (req, res) {
	var _id = req.params['_id'];

	if (_id) {
		Order.findOne({_id: _id}).populate('client').populate('address').exec(function(err, doc) {
			if (!err && doc) {
				res.send({order: doc});
			} else {
				plerror.throw(plerror.c.OrderNotFound, err || util.format('Order not found for _id: %s',_id), res);
			}
		});
	} else {
		plerror.throw(plerror.c.MissingParameters, 'Missing parameters _id', res);
	}
	
}

/**
 * Create a new Order for a Client and returns a partial Order object
 *
 * @param {Object} payload in the form { order: { client: 'ObjectId', ... (order fields) }, replace_order_id:'' }
 * @return {Object} order partial Order object
 * @api public
 */
exports.create = function (req, res) {

	var order = req.body.order;
	
	if (order && order.client) {
		
		var client = null;
		var oldOrder = null;

		async.series([ 
			// 1. Check if we are submitting an Order with an existing order id
			function(callback) { 
				if (req.body.replace_order_id) {
					Order
					.findOne({
						_id: req.body.replace_order_id
					})
					.exec(function(err, doc) {
						if (!err && doc) {
							
							oldOrder = doc;

							// Move payment.logs to the new Order
							if (oldOrder.payment && oldOrder.payment.logs) {
								order['payment'] = oldOrder.payment;
							};
							
							callback(null, 'found old order');

						} else {
							callback(null, 'could not remove old order');
						}
					});
				} else {
					callback(null, 'no order to replace');
				}
			},
			// 2. Get Client
			function(callback) {
				Client.findOne({_id: order.client})
				.exec(function(err, doc) {
					if (!err) {
						client = doc;
						callback(null, 'got client');
					} else {
						callback({
							code: plerror.c.ClientNotFound, 
							verbose: err || 'Client not found'
						}, null);
					}
				});
			},
			// 3. Validate Coupon if exists
			function(callback) {
				// TODO
				// REFACTORING
				if (order.coupon_code) {

					// Check if coupon is not consumed
					var consumed = client.consumed_coupons.indexOf(order.coupon_code);
					if(consumed === -1) {
						// Push to consumed
						client.consumed_coupons.push(order.coupon_code);
						callback(null, 'coupon is OK');
					} else {

						var consumedError = {
							code: plerror.c.CouponConsumed, 
							verbose: 'Coupon is already consumed'
						}

						// The Coupon was consumed
						// But is possible that a previous unfinished Order used it
						// Let's check
						if (oldOrder) {
							if (oldOrder.coupon_code === order.coupon_code) {
								// Return coupon OK
								callback(null, 'coupon is OK');	
							} else {
								// Return coupon consumed error
								callback(consumedError, null);
							}
						} else {
							// Return coupon consumed error
							callback(consumedError, null);
						}
					}

				} else {
					callback(null, 'no coupon to be checked');
				}
			}
		],
		// Finally. Create new Order
		function(err, results) {
			if (!err) {
				Order
				.create(order, function(err, doc) {
					if (!err && doc) {

						// Remove OldOrder Id if neccesary
						// We are also doing this on pre Order remove hook
						// But we need to return to the Client the right model
						if(oldOrder) {
							client.orders.splice(client.orders.indexOf(oldOrder._id),1);
						}

						// Save Client
						client.save(function(err, saved) {
							if (!err) {
								
								res.send({order: doc, client: saved});

								// Remove oldOrder if necessary
								if (oldOrder) {
									oldOrder.remove();
								};

							} else {
								plerror.throw(plerror.c.DBError, err || 'Cannot Save Client and Cannot create Order', res);
							}
						});

					} else {
						plerror.throw(plerror.c.DBError, err || 'Cannot create Order', res);
					}
				});
			} else {
				// throw series err
				plerror.throw(err.code, err.verbose, res);
			}
		});
	} else {
		plerror.throw(plerror.c.MissingParameters, 'Missing parameters order', res);
	}
}


// ### Submits the Order and saves required information
// - @param {Object} `{ order: {_id:'xx', photos:[]} }`
// - @return {Object} `order` full Order object
// - @method `PUT`
 
exports.submit = function (req, res) {

	var order = req.body.order;
	if (order && order._id && order.photos) {

		//{ find Order
		Order.findOne({_id: order._id}, function(err, doc) {
			if(!err && doc) {
				var neworder = doc;

				//{ find Client
				Client.findOne({_id: neworder.client}, function(err, doc) {
					if(!err && doc) {
						var client = doc;

						//{ Verifying payment
						//{ Status should be PaymentVerified || NoNeedPayment
						//{ This is status is set internally when the payment 
						//{ has been successfully completed
						//{ and any other status should reject the order

						if(neworder.status === Order.OrderStatus.PaymentVerified || 
							neworder.status === Order.OrderStatus.NoNeedPayment) {

							//} Order is ready !!!
							neworder.status = Order.OrderStatus.Submitted;
							
							//{ update Order
							neworder.photos = order.photos;

							//{ saving
							neworder.save(function(err) {
								if(!err) {
									if (client.orders.indexOf(neworder._id) === -1) {
										client.orders.push(neworder._id);	
									};
									client.save(function(err) {
										if(!err) {
											res.send({order: neworder});
										} else {
											plerror.throw(plerror.c.DBError, err, res);
										}
									})
								} else {
									plerror.throw(plerror.c.DBError, err, res);
								}
							});
						} else {
							plerror.throw(plerror.c.CannotVerifyPayment, util.format('The Order _id %s has status %s and the payment cannot be verified.',neworder._id, neworder.status), res);
							return;
						}
						
					} else {
						plerror.throw(plerror.c.ClientNotFound, err || util.format('Order submit -> Client not found for _id: %s',neworder.client), res);
					}
				});
			} else {
				plerror.throw(plerror.c.OrderNotFound, err || util.format('Order submit -> Order not found for _id: %s',order._id), res);
			}
		});
	} else {
		plerror.throw(plerror.c.MissingParameters, 'Missing parameters order', res);
	}
}

/**
 * Remove Order from database
 *
 * @param {String} _id of the Order to remove
 * @return {String} 200 OK | 400 Error
 * @api private
 */
exports.remove = function (req, res) {

	var _id = req.params['_id'];
	if (_id) {
		Order.findOne({_id: _id}, function(err, doc) {
			if (!err && doc) {
				doc.remove();
				res.send({order: doc});
			} else {
				plerror.throw(plerror.c.ClientNotFound, err || util.format('Order remove -> not found for _id: %s',_id), res);
			}
		});
	} else {
		plerror.throw(plerror.c.MissingParameters, 'Missing parameters _id', res);
	}
}

/**
 * Marks an Order as Canceled by User
 *
 * @param {String} _id of the Order
 * @return {String} 200 OK | 400 Error
 * @api public
 */
 exports.cancel = function(req, res) {
 	var _id = req.params['_id'];
 	if (_id) {
 		Order
 		.findOne({
 			_id: _id
 		})
 		.populate('client')
 		.exec(function(err, doc) {
 			if(!err && doc) {
 				
 				doc.status = Order.OrderStatus.CanceledByUser;
 				doc.save();

 				// If order used copuon, remove it from consumned
 				if(doc.coupon_code && doc.client) {
 					var client = doc.client;
 					if(client.consumed_coupons) {
 						client.consumed_coupons = common._.without(client.consumed_coupons,doc.coupon_code);
 						client.save();
 					}
 				}
 				
 				res.send({order: doc});
 			} else {
 				plerror.throw(plerror.c.OrderNotFound, err || util.format('Order cancel -> not found for _id: %s',_id), res);
 			}
 		});
 	} else {
		plerror.throw(plerror.c.MissingParameters, 'Missing parameters _id', res);
	}
 }
