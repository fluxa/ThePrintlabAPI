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

	if (_id && (_.values(Order.OrderActions).indexOf(action) >= 0)) { // check for query args

		Order.findOne({_id: _id}).exec(function(err, doc) {
			if (!err && doc) {
				
				switch(action) {

					case Order.OrderActions.Start:

						// Check if cost_total == 0
						if (doc.cost_total == 0) {
							doc.status = Order.OrderStatus.NoNeedPayment;
							doc.payment.logs.push(util.format('%s|Payment Started but Order doesn\'t need payment',new Date()));
						} else {
							// Continue with normal Order
							doc.status = Order.OrderStatus.PaymentStarted;
							doc.payment.logs.push(util.format('%s|Payment Started',new Date()));
						}

						break;

					case Order.OrderActions.Complete:
						
						// Check if the Order has already been Verified || Submitted
						if (_.indexOf([Order.OrderStatus.PaymentVerified, Order.OrderStatus.Submitted], doc.status) === -1) {

							// Parse payment info
							var payment_provider = req.body.payment_provider;
							var payment_data = req.body.payment_data;
							if (payment_provider && payment_data) {
								if (Order.PaymentProviders.indexOf(payment_provider) >= 0) {
									// Order payment has been verified
									doc.payment.provider = payment_provider;
									doc.payment.data = payment_data;
									doc.payment.logs.push(util.format('%s|Payment Verified', new Date()));
									doc.status = Order.OrderStatus.PaymentVerified;
								} else {
									plerror.throw(plerror.c.MissingParameters, util.format('Cannot complete payment, unknown payment provider or data is empty => %s',payment), res);
									return;
								}
							} else {
								plerror.throw(plerror.c.MissingParameters, 'Cannot complete payment, missing payment object', res);
								return;
							}

						} else {
							plerror.throw(plerror.c.CannotVerifyPayment, 'Order is already Verified / Submitted, cannot pay twice', res);
							return;
						}
						
						break;

					case Order.OrderActions.Fail:
						doc.status = Order.OrderStatus.PaymentError;
						var payment_log = req.body.payment_log || 'unknown reason';
						if (payment_log) {
							doc.payment.logs.push(util.format('%s|Payment failed with reason: %s',new Date(),payment_log));
						};
						break;
				}

				doc.save(function(err, saveddoc) {
					if (!err && saveddoc) {
						res.send({order: saveddoc});	
					} else {
						plerror.throw(plerror.c.DBError, err || util.format('/order/payment/ -> Cannot save Order _id: %s',_id), res);
					}
				});
			} else {
				plerror.throw(plerror.c.OrderNotFound, err || util.format('Order not found for _id: %s',_id), res);
			}
		});
	} else {
		plerror.throw(plerror.c.MissingParameters, 'Missing parameters _id or wrong action', res);
	}
	
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
					Order.findOne({_id: req.body.replace_order_id})
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

				if (order.coupon_code) {

					// TODO!!!!!!!!!
					// Check for valid code
					var isValid = false;
					// _.each(Client.Coupons, function(coupon, index, all) {
					// 	if (order.coupon_code === coupon.code) {
					// 		isValid = true;
					// 	};
					// });

					if (isValid || true) { // FIXME!!!

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
						callback({
							code: plerror.c.CouponInvalid, 
							verbose: 'The coupon code is not valid' 
						}, null);
					}
				} else {
					callback(null, 'no coupon to be checked');
				}
			}
		],
		// Finally. Create new Order
		function(err, results) {
			if (!err) {
				Order.create(order, function(err, doc) {
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
 		Order.findOne({_id: _id})
 		.exec(function(err, doc) {
 			if(!err && doc) {
 				doc.status = Order.OrderStatus.CanceledByUser;
 				doc.save();
 				res.send({order: doc});
 			} else {
 				plerror.throw(plerror.c.OrderNotFound, err || util.format('Order cancel -> not found for _id: %s',_id), res);
 			}
 		});
 	} else {
		plerror.throw(plerror.c.MissingParameters, 'Missing parameters _id', res);
	}
 }
