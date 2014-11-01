/*!
 * Module dependencies.
 */


var mongoose = require('mongoose');
var Order = require('../models/order');
var Client = require('../models/client');
var Support =require('../models/support');
var Coupon = require('../models/coupon');
var Policy = require('../models/policy');
var Redeem = require('../models/redeem');


// Switch consumed coupons fix
exports.fix_consumed = function(req, res) {

	var policies = [];
	var logs = '';
	var changes = [];

	common.async.series([
		function(callback) {
			Policy
			.find()
			.populate('coupon')
			.exec(function(err, docs) {
				policies = docs;
				logs += common.util.format('Found %d Policies - ',policies.length);
				callback();
			});
		},
		function(callback) {
			common.async.each(policies, function(policy, policy_callback) {
				var policy_coupon_id = policy.coupon._id.toString();
				Client
				.find({
					consumed_coupons:{
						$in: [policy_coupon_id]
					}
				})
				.exec(function(err, docs) {
					logs += common.util.format('and %d Clients - ',docs.length);
					if(!err && docs) {
						logs += 'fixing ';
						common.async.eachLimit(docs, 10, function(client, client_callback) {
							var new_coupons = [];
							common._.each(client.consumed_coupons, function(consumed) {
								if(consumed === policy_coupon_id) {
									logs += '|';
									new_coupons.push(policy._id);
									changes.push(consumed + ' => ' + policy._id);
								} else {
									new_coupons.push(consumed);
								}
							});
							client.consumed_coupons = new_coupons;
							client.save(function(err, saved) {
								if(!err && saved) {
									logs += '.';
								}
								client_callback();
							});
						},
						function(err) {
							policy_callback();
						});
					}
				})
			},
			function(err) {
				if(!err) {
					res.send({success: true, logs: logs, changes: changes});
				} else {
					res.send({success:false, error: err});
				}
			});
		}
	]);

}
