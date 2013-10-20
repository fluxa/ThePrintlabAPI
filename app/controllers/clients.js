
/*!
 * Module dependencies.
 */

var mongoose = require('mongoose')
var Client = mongoose.model('Client')
var plerror = require('../util/plerror');
var util = require('util')

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
					plerror.throw(plerror.c.DBError, err, res);
				}
			});
		});
	} else {
		plerror.throw(plerror.MissingParameters, 'Missing parameters udid', res);
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
				plerror.throw(plerror.ClientNotFound, err || util.format('Client not found with _id: %s',_id), res);
			}
		});
	} else {
		plerror.throw(plerror.MissingParameters, 'Missing parameters _id', res);
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
				plerror.throw(plerror.c.DBError, err, res);
			}
		});
	} else {
		plerror.throw(plerror.MissingParameters, 'Missing parameters query', res);
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
				plerror.throw(plerror.c.ClientNotFound, err || util.format('Client not found with _id: %s',client._id), res);
			};
		});
	} else {
		plerror.throw(plerror.MissingParameters, 'Missing parameters client', res);
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
				plerror.throw(plerror.c.ClientNotFound, err || util.format('Client not found with _id: %s',_id), res);
			}
		});
	} else {
		plerror.throw(plerror.MissingParameters, 'Missing parameters _id', res);
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
				var consumed = client.consumed_coupons.indexOf(payload.coupon_id);
				if(consumed < 0) {
					client.consumed_coupons.push(payload.coupon_id);
					client.save();
					res.send({client:client});
				} else {
					plerror.throw(plerror.c.CouponConsumed, util.format('coupon_id $s already consumed by Client %s',payload.coupon_id,payload.client), res);
				}
			} else {
				plerror.throw(plerror.c.CouponConsumed, err || util.format('Client not found with _id: %s',payload.client), res);
			};
		});
	} else {
		plerror.throw(plerror.MissingParameters, 'Missing parameters payload', res);
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
					if (client.consumed_coupons.indexOf(coupon.code) < 0) {
						coupons.push(coupon);
					};
				};
				res.send({coupons: coupons, client: client._id});
			} else {
				plerror.throw(plerror.c.ClientNotFound, err || util.format('Client not found with _id: %s',_id), res);
			};
		});
	} else {
		plerror.throw(plerror.MissingParameters, 'Missing parameters _id', res);
	}
}