
/*!
 * Module dependencies.
 */

var mongoose = require('mongoose');
var Coupon = require('../models/coupon');
var Policy = require('../models/policy');
var Client = require('../models/client');
var Redeem = require('../models/redeem');
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
		plerror.throw(plerror.c.MissingParameters, 'Missing parameters payload', res);
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

			// GLOBAL and SPECIFIC Policies
			// (not REDEEMABLE)
			function(callback) {

				var now = moment().format('YYYY-MM-DD');

				Policy
				.find({
					type: {
						$ne: Policy.Types.REDEEMABLE.key,
					},
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
						type: Policy.Types.GLOBAL.key
					}
				])
				.populate('coupon')
				.exec(function(err, docs) {
					if(!err && docs) {
						// filter
						common._.each(docs, function(policy) {
							if(client.consumed_coupons.indexOf(policy._id.toString()) === -1) {
								var type = Policy.Types[policy.type];
								policy.type_obj = type;
								policy.sorting_priority = type.sorting_priority;
								policies.push(policy);
							}
						});
					}
					callback(err, 'policies');
				});
			},

			// REDEEMABLE
			// Append policies found in redeemed codes
			function(callback) {
				Redeem
				.find({
					client: client._id
				})
				.populate('policy')
				.sort({date: -1})
				.exec(function(err, docs) {
					if(!err && docs && docs.length > 0) {
						// **LIFO**
						// Last in First out
						Policy
						.populate([docs[0]], {
							path: 'policy.coupon',
							model: Coupon
						},
						function(err, docs2) {
							if(!err && docs2 && docs2.length > 0) {
								var redeem = docs[0];
								var policy = redeem.policy;
								var coupon = policy.coupon;
								if(client.consumed_coupons.indexOf(redeem.code) === -1) {
									var type = Policy.Types[policy.type];
									policy.type_obj = type;
									policy.sorting_priority = type.sorting_priority;
									policy.redeem = redeem;
									policies.push(policy);
								}
								callback();
							} else {
								callback();
							}
						});
					} else {
						callback();
					}
				});
			}
		],
		// Finally
		function(err, results) {
			if(!err) {

				// Only 1
				var coupons = [];

				// Sort
				var sorted_policies = common._.sortBy(policies, 'sorting_priority');

				if(sorted_policies && sorted_policies.length > 0) {
					var policy = sorted_policies[0];
					var packed = policy.coupon.pack(policy._id);
					// change response code if redeemable
					if(policy.redeem) {
						packed.code = policy.redeem.code;
					}
					coupons.push(packed);
				}

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
		plerror.throw(plerror.c.MissingParameters, 'Missing parameters _id', res);
	}
}

/**
 * Redeem a Coupon for Client
 *
 * @param {String} client_id {client_id:'xxx'}
 * @param {String} coupon_code
 * @return {Object} {success:true} || {success:false}
 * - @method `POST`
 * @api public
 */
exports.redeem = function (req, res) {

	var client_id = req.body.client_id;
	var redeem_code = req.body.coupon_code;

	var client = null;
	var redeem = null;

	if(client_id && redeem_code) {

		common.async.series([

			// Get Client
			function(callback){
				Client
				.findOne({
					_id: client_id
				})
				.exec(function(err, doc) {
					if(!err && doc) {
						client = doc;
						callback();
					} else {
						callback({code: plerror.c.ClientNotFound, verbose: 'Client not found'});
					}
				})
			},

			// Find Redeem
			function(callback) {

				Redeem
				.findOne({
					code: redeem_code
				})
				.populate('policy')
				.exec(function(err, doc) {
					if(!err && doc) {
						redeem = doc;
						callback();
					} else {
						callback({code: plerror.c.CouponInvalid, error: common.util.format('%s => Redeem code not found',redeem_code)});
					}
				})
			},

			// Validations
			function(callback) {

				if(redeem.redeemed) {
					callback({code: plerror.c.CouponInvalid, error: common.util.format('%s => Redeem code already used',redeem_code)});
					return;
				}

				if(!redeem.policy.active) {
					callback({code: plerror.c.CouponInvalid, error: common.util.format('%s => Redeem code policy is not active',redeem_code)});
					return;
				}

				var now = common.moment().format('YYYY-MM-DD');
				if(redeem.policy.expiry_date < now) {
					callback({code: plerror.c.CouponInvalid, error: common.util.format('%s => Redeem code policy already expired',redeem_code)});
					return;
				}

				callback();

			},

			// Redeem
			function(callback) {
				redeem.redeemed = true;
				redeem.client = client._id;
				redeem.date = common.moment().format('YYYY-MM-DD HH:mm');
				redeem.save(function(err, saved){
					if(!err && saved) {
						redeem = saved;
						callback();
					} else {
						callback({code: plerror.c.DBError, error:'Failed to save Redeem'});
					}
				});
			}
		],
		// Finally
		function(err, results) {
			if(!err) {
				res.send({success:true, redeem: redeem});
			} else {
				plerror.throw(err.code, err.verbose, res);
			}
		});

	} else {
		plerror.throw(plerror.c.MissingParameters, 'Missing parameters client_id or coupon_code', res);
	}


}
