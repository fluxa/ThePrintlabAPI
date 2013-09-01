
/*!
 * Module dependencies.
 */

var mongoose = require('mongoose')
var Client = mongoose.model('Client')
var plerror = require('../../plerror');

/**
 * Registers a new Client into the system
 *
 * @param {String} udid unique device identifier generated on the device
 * @return {Object} User object
 * @api public
 */
exports.register = function (req, res) {

	var udid = req.body.udid;

	if (udid) {
		
		//try to find client first
		Client.findOne({udid: udid}, function(err, doc) {
			if(!err && doc) {
				//Client found, return
				res.send({'client':doc});
				return;
			}

			// client not found -> register new
			var newClient = new Client({
				udid: udid
			});

			newClient.save(function(err, doc) {
				if (!err) {
					res.send({'client':doc});
				} else {
					res.send(400, plerror.CannotSaveDocument('Client register -> Cannot save Client', null));
				}
			});
		});
	} else {
		res.send(400, plerror.MissingParameters('', null))
	}
}

/**
 * Gets a Client by _id
 *
 * - @param {String} _id from Client
 * - @return {Object} Client object
 * - @method `GET`
 * - @api public
 */
exports.get = function (req, res) {

	var _id = req.params['_id'];
	if (_id) {
		Client.findOne({_id:_id}, function(err, doc) {
			if(!err && doc) {
				res.send({client:doc});
			} else {
				res.send(400, plerror.ClientNotFound('Client not found with _id: {0}'.format(_id), err));
			}
		});
	} else {
		res.send(400, plerror.MissingParameters('', null))
	}
}


// ### Find Clients by {query:{'prop':'value'}}
// - @param {Object} query in the form {'prop':'value'}
// - @return {Array} array of Client objects
// - @method `POST`
// - @api private
exports.find = function (req, res) {

	var  query = req.body.query;
	if (query) {
		Client.find(query, function(err, docs) {
			if(!err) {
				res.send({clients:docs});
			} else {
				res.send(400,{error:err})
			}
		});
	} else {
		res.send(400, plerror.MissingParameters('', null))
	}
}


/**
 * Updates Client information
 *
 * @param {Object} client partial Client object with updated fields
 * @return {Object} updated Client object
 * - @method `POST`
 * @api public
 */
exports.update = function (req, res) {

	var client = req.body.client;
	if (client && client._id) {
		var _id = client._id;
		delete client._id;
		Client.findByIdAndUpdate(_id, client, function(err, doc) {
			if (!err && doc) {
				res.send({client:doc});
			} else {
				res.send(400, plerror.ClientNotFound('Client not found with _id: {0}'.format(client._id), err));
			};
		});
	} else {
		res.send(400, plerror.MissingParameters('', null))
	}
}

/**
 * Remove Client from database
 *
 * @param {String} _id of the Client to remove
 * @return {String} 200 OK
 * @api public
 */
exports.remove = function (req, res) {

	var _id = req.params['_id'];
	if (_id) {
		Client.findOne({_id: _id}, function(err, doc) {
			if (!err && doc) {
				doc.remove();
				res.send({success:true});
			} else {
				res.send(400, plerror.ClientNotFound('Client not found with _id: {0}'.format(_id), err));
			}
		});
	} else {
		res.send(400, plerror.MissingParameters('', null))
	}
}


/**
 * Try to consume a cupon code
 *
 * @param {Object} payload { payload:{client:'ObjectId', coupon_id:'xxx'} }
 * @return {String} 200 OK | 400 Error
 * @api public
 */
exports.coupon_consume = function (req, res) {

	var payload = req.body.payload;
	if (payload && payload.client && payload.coupon_id) {
		Client.findOne({_id: payload.client}, function(err, doc) {
			if (!err && doc) {
				var client = doc;
				var consumed = client.coupons.indexOf(payload.coupon_id);
				if(consumed < 0) {
					client.coupons.push(payload.coupon_id);
					client.save();
					res.send({client:client});
				} else {
					res.send(400, plerror.CouponConsumed('coupon_id {0} already consumed by Client {1}'.format(payload.coupon_id,payload.client), null));
				}
			} else {
				res.send(400, plerror.ClientNotFound('Client not found with _id: {0}'.format(payload.client), err));
			};
		});
	} else {
		res.send(400, plerror.MissingParameters('', null));
	}
}

/**
 * Returns a list of coupons available (not consumed) by the Client
 *
 * @param {String} _id {_id:'xxx'}
 * @return {Array} array of coupons
 * - @method `GET`
 * @api public
 */
exports.coupon_get = function (req, res) {

	var _id = req.params['_id'];
	if (_id) {
		Client.findOne({_id: _id}, function(err, doc) {
			if (!err && doc) {
				var client = doc;
				var coupons = [];
				for (var i = Client.Coupons.length - 1; i >= 0; i--) {
					var coupon = Client.Coupons[i];
					if (client.coupons.indexOf(coupon.code) < 0) {
						coupons.push(coupon);
					};
				};
				res.send({coupons: coupons, client: client._id});
			} else {
				res.send(400, plerror.ClientNotFound('Client not found with _id: {0}'.format(_id), err));
			};
		});
	} else {
		res.send(400, plerror.MissingParameters('', null));
	}
}