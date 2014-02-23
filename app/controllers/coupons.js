
/*!
 * Module dependencies.
 */

var mongoose = require('mongoose');
var Coupon = mongoose.model('Coupon');
var Policy = mongoose.model('Policy');
var Client = mongoose.model('Client');
var plerror = require('../util/plerror');
var util = require('util');
var security = require('../util/security');
var async = require('async');
var moment = require('moment');
var _ = require('underscore');

/**
 * Try to consume a cupon code
 *
 * @param {Object} payload { payload:{client:'ObjectId', coupon_id:'xxx'} }
 * @return {String} 200 OK | 400 Error
 * @api public
 */
exports.consume = function (req, res) {

	var payload = req.body.payload;
	if (payload && payload.client && payload.coupon_id) {
		Client.findOne({
			_id: payload.client
		})
		.exec(function(err, doc) {
			if (!err && doc) {
				var client = doc;
				var consumed = client.consumed_coupons.indexOf(payload.coupon_id);
				if(consumed < 0) {
					client.consumed_coupons.push(payload.coupon_id);
					client.save();
					res.send({client:client});
				} else {
					plerror.throw(plerror.c.CouponConsumed, util.format('coupon_id %s already consumed by Client %s',payload.coupon_id,payload.client), res);
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
 * Returns an array of available coupons (not consumed) for the Client
 *
 * @param {String} client_id {client_id:'xxx'}
 * @return {Array} array of coupons
 * - @method `GET`
 * @api public
 */
exports.get = function (req, res) {

	var client_id = req.params['client_id'];

	if (client_id) {

		var client = {};
		var policies = [];

		async.series([
			
			// Get Client
			function(callback) {
				Client.findOne({
					_id: client_id
				})
				.exec(function(err, doc) {
					if(!err && doc) {
						client = doc;
						callback(null, 'client');
					} else {
						callback(err || plerror.c.ClientNotFound, null);
					}
				})
			},

			// Suitable Policies
			function(callback) {
				var now = moment().format('YYYY-MM-DD');
				Policy.find({
					coupon:{
						$nin: client.consumed_coupons
					},
					active: true,
					expiry_date: {
						$gte: now
					}
				})
				.or([
					{
						target_clients:{
							$in: [client._id]
						}
					},
					{
						type: Policy.Types.Global
					}
				])
				.populate('coupon')
				.sort({
					type: -1
				})
				.exec(function(err, docs) {
					if(!err && docs) {
						policies = docs;
					}
					callback(err, 'policies');
				});
			}
		],
		// Finally
		function(err, results) {
			if(!err) {
				var coupons = [];
				_.each(policies, function(policy, index, all) {
					coupons.push(policy.coupon);
				});
				var couponsStr = JSON.stringify(coupons);
				var encrypted = security.pack(couponsStr);
				res.send({
					coupons: coupons, 
					client: client._id, 
					coupons_encrypted: encrypted
				});
			} else {
				if(err === plerror.c.ClientNotFound) {
					plerror.throw(err, 'Client not found for id provided', res);
				} else {
					plerror.throw(plerror.c.DBError, err || 'Unknown error', res);
				}
			}
		});
	} else {
		plerror.throw(plerror.MissingParameters, 'Missing parameters _id', res);
	}
}