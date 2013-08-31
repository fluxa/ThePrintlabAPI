/*!
 * Module dependencies.
 */

var mongoose = require('mongoose')
var Order = mongoose.model('Order');
var Client = mongoose.model('Client');
var plerror = require('../../plerror');
 
// ### Return all posible status codes nicely formatted for using on the web-admin
// - @preturn {Array} list of all posible OrderStatus
// - @method `GET`

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
		res.send(400, plerror.MissingParameters(''))
	}
}


 // ### Find all Orders return full documents for references with ObjectId
 // @return {Array} array of full Order objects
 // @method `GET`
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
 // @return {Object} Order object
 // @method `GET`
exports.get = function (req, res) {
	var _id = req.query._id;
	if (_id) {
		Order.findOne({_id: _id}).exec(function(err, doc) {
			if (!err && doc) {
				res.send({order: doc});
			} else {
				res.send(400, plerror.OrderNotFound('Order not found for _id: {0}'.format(_id)));
			}
		});
	} else {
		res.send(400, plerror.MissingParameters(''));
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
				console.log(err);
				res.send(400, plerror.CannotSaveDocument('Cannot create Order'));
			}
		});

	} else {
		res.send(400, plerror.MissingParameters(''))
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

						//{ TODO: verify payment???
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
										console.log(err);
										res.send(400, plerror.CannotSaveDocument('Order submit -> Cannot save Client'));
									}
								})
							} else {
								console.log(err);
								res.send(400, plerror.CannotSaveDocument('Order submit -> Cannot save Order'));
							}
						});
					} else {
						console.log(err);
						res.send(400, plerror.ClientNotFound('Order submit -> Client not found for _id: {0}'.format(neworder.client)));		
					}
				});

			} else {
				console.log(err);
				res.send(400, plerror.OrderNotFound('Order submit -> Order not found for _id: {0}'.format(order._id)));
			}
		});
		

	} else {
		res.send(400, plerror.MissingParameters(''))
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
				console.log(err);
				res.send(400, plerror.ClientNotFound('Order remove -> not found for _id: {0}'.format(_id)));
			}
		});
	} else {
		res.send(400, plerror.MissingParameters(''))
	}
}