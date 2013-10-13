/*!
 * Module dependencies.
 */

var mongoose = require('mongoose')
var Order = mongoose.model('Order');
var Client = mongoose.model('Client');
var plerror = require('../../plerror');
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
				res.send(400,{error:err})
			}
		});
	} else {
		res.send(400, plerror.MissingParameters('', null))
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
			res.send(400, {error: err});
		}
	});
}

// ### Get one Order by _id
// - @return {Object} Order object
// - @method `GET`
// - @api `private`
exports.get = function (req, res) {
	var _id = req.params['_id'];

	if (_id) {
		Order.findOne({_id: _id}).populate('client').populate('address').exec(function(err, doc) {
			if (!err && doc) {
				res.send({order: doc});
			} else {
				res.send(400, plerror.OrderNotFound(util.format('Order not found for _id: %s',_id), err));
			}
		});
	} else {
		res.send(400, plerror.MissingParameters('', null));
	}
	
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
						doc.status = Order.OrderStatus.PaymentStarted;
						doc.payment.logs.push(util.format('%s|Payment Started',new Date()));
						break;

					case Order.OrderActions.Complete:
						
						// Parse payment info
						var payment_provider = req.body.payment_provider;
						var payment_data = req.body.payment_date;
						if (payment_provider && payment_data) {
							if (Order.PaymentProviders.indexOf(payment_provider) >= 0) {
								// Order payment has been verified
								doc.payment.provider = payment_provider;
								doc.payment.data = payment_data;
								doc.payment.logs.push(util.format('%s|Payment Completed', new Date()));
								doc.status = Order.OrderStatus.PaymentVerified;
							} else {
								res.send(400, plerror.MissingParameters(util.format('Cannot complete payment, unknown payment provider or data is empty => %s',payment), null));
								return;
							}
						} else {
							res.send(400, plerror.MissingParameters('Cannot complete payment, missing payment object', null));
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
						res.send(400, plerror.CannotSaveDocument(util.format('/order/payment/ -> Cannot save Order _id: %s',_id), err));
					}
				});
			} else {
				res.send(400, plerror.OrderNotFound(util.format('Order not found for _id: %s',_id), err));
			}
		});
	} else {
		res.send(400, plerror.MissingParameters('', null));
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
		
		async.series([ // using series to avoid saving same document in parallel
			function(callback) { // check if already had submitted this Order and remove doc
				if (req.body.replace_order_id) {
					Order.findOne({_id: req.body.replace_order_id}, function(err, doc) {
						if (!err && doc) {
							doc.remove(function(err) {
								if (!err) {
									console.log('Order => create => removed previous order');
								} else {
									console.log(util.format('Order => create => error: %s',err));
								}
								callback(null, 'done');
							});
						} else {
							callback(null, 'done');
						}
					});
				} else {
					callback(null, 'done');
				}
			},
			function(callback) { // create new Order and return doc
				Order.create(order, function(err, doc) {
					if (!err && doc) {
						res.send({order: doc});
					} else {
						res.send(400, plerror.CannotSaveDocument('Cannot create Order', err));
					}
				});
			}
		]);

	} else {
		res.send(400, plerror.MissingParameters(JSON.stringify(req.body), null))
	}
}


// ### Submits the Order and saves required information
// - @param {Object} `{ order: {_id:'xx', photo_ids:[]} }`
// - @return {Object} `order` full Order object
// - @method `PUT`
 
exports.submit = function (req, res) {

	var order = req.body.order;
	if (order && order._id && order.photo_ids) {

		//{ find Order
		Order.findOne({_id: order._id}, function(err, doc) {
			if(!err && doc) {
				var neworder = doc;

				//{ find Client
				Client.findOne({_id: neworder.client}, function(err, doc) {
					if(!err && doc) {
						var client = doc;

						//{ Verifying payment
						//{ Status should be PaymentVerified
						//{ This is status is set internally when the payment 
						//{ has been successfully completed
						//{ and any other status should reject the order
						if(neworder.status === Order.OrderStatus.PaymentVerified) {

							//} Order is ready !!!
							neworder.status = Order.OrderStatus.Submitted;
							
							//{ update Order
							neworder.photo_ids = order.photo_ids;

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
											res.send(400, plerror.CannotSaveDocument('Order submit -> Cannot save Client', err));
										}
									})
								} else {
									res.send(400, plerror.CannotSaveDocument('Order submit -> Cannot save Order', err));
								}
							});

						} else {
							res.send(400, plerror.CannotVerifyPayment(util.format('The Order _id %s has status %s and the payment cannot be verified.',neworder._id, neworder.status), null));
							return;
						}
						
					} else {
						res.send(400, plerror.ClientNotFound(util.format('Order submit -> Client not found for _id: %s',neworder.client), err));		
					}
				});

			} else {
				res.send(400, plerror.OrderNotFound(util.format('Order submit -> Order not found for _id: %s',order._id), err));
			}
		});
		

	} else {
		res.send(400, plerror.MissingParameters('', null))
	}
}

/**
 * Remove Order from database
 *
 * @param {String} _id of the Order to remove
 * @return {String} 200 OK | 400 Error
 * @api public
 */
exports.remove = function (req, res) {

	var _id = req.params['_id'];
	if (_id) {
		Order.findOne({_id: _id}, function(err, doc) {
			if (!err && doc) {
				doc.remove();
				res.send({order: doc});
			} else {
				res.send(400, plerror.ClientNotFound(util.format('Order remove -> not found for _id: %s',_id), err));
			}
		});
	} else {
		res.send(400, plerror.MissingParameters('', null))
	}
}