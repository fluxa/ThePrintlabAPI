/*!
 * Module dependencies.
 */

var mongoose = require('mongoose')
var Order = mongoose.model('Order');
var Client = mongoose.model('Client');
var plerror = require('../../plerror');
var _ = require('underscore');
 
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

	// For debugging Webpay
	if (_id === 'ORDER_ID_WEBPAY_DEBUGGING') {
		res.send({order: Order.OrderDebugging});
		return;
	};
	// End 

	if (_id) {
		Order.findOne({_id: _id}).exec(function(err, doc) {
			if (!err && doc) {
				res.send({order: doc});
			} else {
				res.send(400, plerror.OrderNotFound('Order not found for _id: {0}'.format(_id), err));
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

	if (_id && (_.values(Order.OrderActions).indexOf(action) >= 0)) {

		Order.findOne({_id: _id}).exec(function(err, doc) {
			if (!err && doc) {
				
				switch(action) {

					case Order.OrderActions.Start:
						doc.status = Order.OrderStatus.PaymentStarted;
						break;

					case Order.OrderActions.Complete:
						
						// get payment object
						var payment = req.body.data;
						console.log(req.body);
						if (payment) {
							if (Order.PaymentProviders.indexOf(payment.provider) >= 0 && payment.data) {
								doc.payment = payment;
								doc.status = Order.OrderStatus.PaymentCompleted;
							} else {
								res.send(400, plerror.MissingParameters('Cannot complete payment, unknown payment provider or data is empty => {0}'.format(payment), null));
								return;
							}
						} else {
							res.send(400, plerror.MissingParameters('Cannot complete payment, missing payment object', null));
							return;
						}
						break;
				}

				doc.save(function(err, saveddoc) {
					if (!err && saveddoc) {
						res.send({order: saveddoc});	
					} else {
						res.send(400, plerror.CannotSaveDocument('/order/payment/ -> Cannto save Order _id: {0}'.format(_id), err));
					}
				});
			} else {
				res.send(400, plerror.OrderNotFound('Order not found for _id: {0}'.format(_id), err));
			}
		});
	} else {
		res.send(400, plerror.MissingParameters('', null));
	}
	
}

/**
 * Create a new Order for a Client and returns a partial Order object
 *
 * @param {Object} payload in the form { payload: { client: 'ObjectId', order:{Object}} }
 * @return {Object} order partial Order object
 * @api public
 */
exports.create = function (req, res) {

	var order = req.body.order;
	
	if (order && order.client) {
		
		Order.create(order, function(err, doc) {
			if (!err && doc) {
				res.send({order: doc});
			} else {
				res.send(400, plerror.CannotSaveDocument('Cannot create Order', err));
			}
		});

	} else {
		res.send(400, plerror.MissingParameters('', null))
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
						//{ Status should be PaymentComplete
						//{ This is status is set internally when the payment 
						//{ has been successfully completed
						//{ and any other status should reject the order
						if(neworder.status === Order.OrderStatus.PaymentComplete) {

							//} Payment verified!!!
							neworder.status = Order.OrderStatus.PaymentVerified;
							neworder.payment = {
								verification_code: 'SUPER_VERIFICATION_CODE',
								error:''
							}

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
							res.send(400, plerror.CannotVerifyPayment('The Order _id {0} has status {1} and the payment cannot be verified.'.format(neworder._id, neworder.status), null));
							return;
						}
						
					} else {
						res.send(400, plerror.ClientNotFound('Order submit -> Client not found for _id: {0}'.format(neworder.client), err));		
					}
				});

			} else {
				res.send(400, plerror.OrderNotFound('Order submit -> Order not found for _id: {0}'.format(order._id), err));
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
				res.send(400, plerror.ClientNotFound('Order remove -> not found for _id: {0}'.format(_id), err));
			}
		});
	} else {
		res.send(400, plerror.MissingParameters('', null))
	}
}