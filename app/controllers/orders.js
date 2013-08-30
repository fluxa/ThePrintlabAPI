/*!
 * Module dependencies.
 */

var mongoose = require('mongoose')
var Order = mongoose.model('Order');
var Client = mongoose.model('Client');

/**
 * Return all posible status codes nicely formatted for using on the web-admin
 *
 * @return {Array} list of status
 * @api public
 */
exports.status_list = function (req, res) {
	res.send(Order.OrderStatusList);
}

/**
 * Find Orders by {query:{'prop':'value'}}
 *
 * @param {Object} query in the form {'prop':'value'}
 * @return {Array} array of Order objects
 * @api private
 */
exports.find = function (req, res) {

	var  query = req.query.query;
	if (query) {
		Order.find(query, function(err, docs) {
			if(!err) {
				res.send({orders:docs});
			} else {
				res.send(400,{error:err})
			}
		});
	} else {
		res.send(400,{error:'missing parameters'})
	}
}

/**
 * Create a new Order for a Client and returns a partial Order object
 *
 * @param {Object} payload in the form { payload: { client_id: 'xxx', order:{Object}} }
 * @return {Object} order partial Order object
 * @api public
 */
exports.create = function (req, res) {

	var order = req.body.order;
	console.log(order);
	if (order && order.client_id) {
		
		Order.create(order, function(err, doc) {
			if (!err && doc) {
				res.send({order: doc});
			} else {
				res.send(400, {error: err || 'Cannot create Order'});
			}
		});

	} else {
		res.send(400,{error:'missing parameters'})
	}
}

/**
 * Submits the Order and saves required information
 *
 * @param {Object} order {_id:'xx', photo_ids:[]}
 * @return {Object} order full Order object
 * @api public
 */
exports.submit = function (req, res) {

	var order = req.body.order;
	if (order && order._id && order.photo_ids) {
		
		//find Order
		Order.findOne({_id: order._id}, function(err, doc) {
			if(!err && doc) {
				var neworder = doc;

				//find Client
				Client.findOne({_id: neworder.client_id}, function(err, doc) {
					if(!err && doc) {
						var client = doc;

						//TODO: verify payment???
						neworder.status = Order.OrderStatus.PaymentVerified;
						neworder.payment = {
							verification_code: 'SUPER_VERIFICATION_CODE',
							error:''
						}

						//update Order
						neworder.photo_ids = order.photo_ids;

						//saving
						neworder.save(function(err) {
							if(!err) {
								client.orders.push(neworder._id);
								client.save(function(err) {
									if(!err) {
										res.send({order: neworder});
									} else {
										res.send(400, {error: err || 'Order submit: Cannot save Client'});
									}
								})
							} else {
								res.send(400, {error: err || 'Order submit: Cannot save Order'});
							}
						});
					} else {
						res.send(400, {error: err || 'Order submit: Client not found for _id'});		
					}
				});

			} else {
				res.send(400, {error: err || 'Order submit: Order not found for _id'});
			}
		});
		

	} else {
		res.send(400,{error:'missing parameters'})
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

	var _id = req.body._id;
	if (_id) {
		Order.findByIdAndRemove(_id, function(err, doc) {
			if (!err && doc) {
				res.send({success:true});
			} else {
				res.send(400,{error: err || 'Order not found for _id'});
			};
		});
	} else {
		res.send(400,{error:'missing parameters'})
	}
}