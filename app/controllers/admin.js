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
var csv = require('csv');

/*
* Routes
*/

exports.dashboard = function(req, res) {

	var orders = [];
	var clients = [];

	common.async.series([
		// Get all Orders
		function(callback) {
			Order.find({})
			.exec(function(err, docs) {
				if(!err && docs) {
					orders = docs;
				}
				callback(null, 'orders');
			})
		},
		//Get all Clients
		function(callback) {
			Client.find({})
			.exec(function(err, docs) {
				if(!err && docs) {
					clients = docs;
				}
				callback(null, 'clients');
			})
		}
	], function(err, results) {
		res.render('admin/dashboard', {orders: orders, clients: clients, ostatus: Order.OrderStatus});
	});
}

exports.orders = function(req, res) {

	var orders = [];

	common.async.series([

		// Get All Orders
		function(callback) {

			Order.find({})
			.sort({_id: -1})
			.populate('address')
			.populate('client')
			.exec(function(err, docs) {
				if(!err && docs) {
					orders = docs;
				}
				callback(null, 'orders');
			});
		}

	// Finish
	], function(err, results) {
		res.render('admin/orders', {orders: orders, getTimestamp: getTimestamp, toPrettyDate: toPrettyDate});
	});
}

exports.clients = function(req, res) {
	var clients = [];

	common.async.series([
		//Get all
		function(callback) {
			Client.find({})
			.sort({_id: -1})
			.populate('addresses')
			.exec(function(err, docs) {
				if (!err && docs) {
					clients = docs;
				};
				callback(null, 'clients');
			});
		}
	// Finish
	], function(err, results) {
		res.render('admin/clients', {clients: clients});
	});
}

/**
 * Manage a group of Orders base on the action parameter
 *
 * @param [String] order_ids Array of Order _id
 * @param {String} action
 * @return {String} 200 OK | 400 Error
 * @api private
 */
exports.orders_manage = function (req, res) {

	var order_ids = req.body.order_ids;
	var action = req.body.action;
	var count_orders_modified = 0;

	if (order_ids && action) {

		Order.find({
			_id: {
				$in: order_ids
			}
		})
		.exec(function(err, docs) {

			if (!err && docs) {

				common.async.eachSeries(docs, function(order, callback) {

					var modified = false;
					var finish = function() {
						callback(null);
					}

					switch(action) {

						case 'printing':
							order.status = Order.OrderStatus.Printing;
							modified = true;
							break;

						case 'shipped':
							order.status = Order.OrderStatus.Shipped;
							modified = true;
							break;

						case 'delete':
							finish = function(){};
							order.remove(function(err, removed) {
								count_orders_modified++;
								callback(null);
							});
							break;
					}

					if(modified) {
						order.save(function(err, saved) {
							count_orders_modified++;
							finish();
							if(err) {
								console.log('Error saving Order in change_status => ' + err);
							}
						});
					} else {
						finish();
					}
				},
				// Finish
				function(err) {
					req.flash('success', common.util.format('%d Orders has been modified',count_orders_modified));
					res.redirect('/admin/orders');
				});

			} else {
				req.flash('error', err || common.util.format('Order change_status -> not found for ids: %s',order_ids));
				res.redirect('/admin/orders');
			}
		});
	} else {
		req.flash('error', 'Missing parameters order_ids, action');
		res.redirect('/admin/orders');
	}
}

exports.orders_export = function(req, res) {

	var rows = [];
	var header = [
		'Date',
		'OrderID',
		'Status',
		'Photos',
		'Total',
		'Cost Printing',
		'Cost Shipping',
		'Coupon',
		'ClientID',
		'Email',
		'Phone',
		'To',
		'Address',
		'Region',
		'Provincia',
		'Comuna',
		'Gift Message'
	];
	rows.push(header);

	var order_ids = req.body.order_ids;

	if (order_ids) {

		Order.find({
			_id: {
				$in: order_ids
			}
		})
		.sort({_id: -1})
		.populate('address')
		.populate('client')
		.exec(function(err, docs) {

			if(!err && docs) {
				common._.each(docs, function(order, index, all) {
					var row = [];
					var m = common.moment(getTimestamp(order._id));
					row.push(m.format('YYYY-MM-DD HH:mm'));
					row.push(order._id.toString());
					row.push(order.status);
					row.push(order.photo_count);
					row.push(order.cost_total);
					row.push(order.cost_printing);
					row.push(order.cost_shipping);
					row.push(order.coupon_code);
					row.push(order.client._id.toString());
					row.push(order.client.email);
					row.push(order.client.mobile);
					row.push(common.util.format('%s %s',order.address.name,order.address.last_name));
					row.push(common.util.format('%s %s',order.address.address_line1,order.address.address_line2));
					row.push(order.address.region);
					row.push(order.address.provincia);
					row.push(order.address.comuna);
					row.push(order.gift ? order.gift.message : '');
					rows.push(row);
				});
			}
			// Create CSV
			csv.stringify(rows, function(err, data) {
        var m = common.moment();
        var filename = common.util.format('%s-ThePrintlabOrders.csv',m.format('YYYY-MM-DD'));
        res.setHeader('Content-disposition', 'attachment; filename='+filename);
        res.setHeader('Content-type', 'text/plain');
        res.charset = 'UTF-8';
        res.write(data);
        res.end();
      });

		});

	} else {
		req.flash('error', 'Missing parameters order_ids');
		res.redirect('/admin/orders');
	}

}

// Coupons
exports.coupons = function(req, res) {

	var coupons = [];

	common.async.series([
		// Get All
		function(callback) {
			Coupon.find({})
			.exec(function(err, docs) {
				if(!err && docs) {
					coupons = docs;
				}
				callback(null, 'coupons');
			});
		}
	],
	// Finally
	function(err, results) {
		res.render('admin/coupons', {
			coupons: coupons
		});
	});
}

exports.coupons_add = function(req, res) {

	var cpn = req.body.coupon || {};

	if(cpn.title && cpn.description && cpn.rules) {
		console.log(cpn);
		var c = new Coupon();
		c.title = cpn.title;
		c.description = cpn.description;
		c.currency = cpn.currency;
		c.rules = cpn.rules;
		c.save(function(err, saved){
			res.redirect('/admin/coupons');
		});

		// cpn.save(function(err, saved) {
		// 	console.log('WHATTTT');
		// 	if(!err) {
		// 		req.flash('success', 'New Coupon Saved!');
		// 	} else {
		// 		req.flash('error', err ? JSON.stringify(err) : 'Error trying to save coupon, please try again.');
		// 	}
		// 	res.redirect('/admin/coupons');
		// });
	} else {
		req.flash('error', 'Missing parameters');
		res.redirect('/admin/coupons');
	}

}

// Coupons
exports.policies = function(req, res) {

	var policies = [];
	var coupons = [];
	var clients = [];
	var policy_types = [];

	common.async.series([

		// Get All Policies
		function(callback) {
			Policy.find({})
			.populate('coupon')
			.exec(function(err, docs) {
				if(!err && docs) {
					policies = docs;
				}

				// types
				var keys = Object.keys(Policy.Types);
				common._.each(keys, function(key) {
					var obj = Policy.Types[key];
					policy_types.push(obj);
				});
				callback();
			});
		},

		// Get all Coupons
		function(callback) {
			Coupon.find({})
			.exec(function(err, docs) {
				if(!err && docs) {
					coupons = docs;
				}
				callback();
			});
		},

		// Get all Clients
		function(callback) {
			Client.find({})
			.exec(function(err, docs){
				if(!err && docs){
					clients = docs;
				}
				callback();
			})
		}

	],
	// Finally
	function(err, results) {
		res.render('admin/policies', {
			policies: policies,
			coupons: coupons,
			clients: clients,
			policy_types: policy_types
		});
	});
}

exports.policies_add = function(req, res) {

	var policy = req.body.policy || {};

	if(policy.name && policy.type && policy.coupon && policy.expiry_date) {

		// Validations
		var valid = true;
		var errors = [];

		if(policy.type === Policy.Types.SPECIFIC.key && !policy.target_clients) {
			valid = false;
			errors.push('Must select at least 1 Client for SPECIFIC policy type');
		}

		if(policy.type === Policy.Types.GLOBAL.key) {
			policy.target_clients = [];
		}

		policy.active = policy.active ? true : false;

		if(policy.never_expires) {
			policy.expiry_date = '2999-01-01';
		}

		var now = common.moment().utc().format('YYYY-MM-DD');
		if(policy.expiry_date < now) {
			valid = false;
			errors.push('Expiry Date should be in the future');
		}

		if(valid) {
			var p = new Policy(policy);
			p.save(function(err, saved) {
				if(!err && saved) {
					req.flash('success', 'New Policy Saved!');
				} else {
					req.flash('error', err ? JSON.stringify(err) : 'Error trying to save policy, please try again.');
				}
				res.redirect('/admin/policies');
			});
		} else {
			req.flash('error', errors);
			res.redirect('/admin/policies');
		}
	} else {
		req.flash('error', 'Missing parameters');
		res.redirect('/admin/policies');
	}
}

exports.policies_active = function(req, res) {

	var policy = req.body.policy;
	if(policy._id && policy.active != null) {
		Policy.findOne({_id: policy._id})
		.exec(function(err, doc) {
			if(!err) {
				doc.active = policy.active === 'true' ? true : false;
				doc.save(function(err, saved) {
					res.send({success: err ? false : true, policy: saved});
				});
			} else {
				res.send({success: false, policy: policy});
			}
		});
	} else {
		res.send({success:false, policy: policy});
	}

}

exports.policies_manage_codes = function(req, res) {

	var _id = req.params._id;

	var policy;
	var redeems = [];

	common.async.series([

		// Valid
		function(callback) {
			if(_id) {
				callback();
			} else {
				callback('Missing parameter _id');
			}
		},

		// Policy
		function(callback) {
			Policy
			.findOne({
				_id: _id
			})
			.populate('coupon')
			.exec(function(err, doc) {
				if(!err && doc) {
					policy = doc;
					callback();
				} else {
					callback('Policy not found');
				}
			});
		},

		// Redeems
		function(callback) {
			Redeem
			.find({
				policy: policy._id
			})
			.populate('client')
			.sort({_id: -1})
			.exec(function(err, docs) {
				if(!err && docs) {
					redeems = docs;
				}
				callback();
			})
		}
	],
	// Finally
	function(err) {
		if(!err) {
			res.render('admin/manage_codes',{
				policy: policy,
				redeems: redeems
			});
		} else {
			req.flash('error',err);
			res.redirect('/policies');
		}
	});

}

exports.policies_generate_codes = function(req, res) {

	var policy_id = req.body.policy_id;
	var num_codes = parseInt(req.body.num_codes);

	common.async.series([

		// Valid
		function(callback) {
			if(policy_id && num_codes && num_codes > 0) {
				callback();
			} else {
				callback('Missing parameter policy_id, num_codes');
			}
		},

		// Policy
		function(callback) {

			Policy
			.findOne({
				_id: policy_id
			})
			.populate('coupon')
			.exec(function(err, doc) {
				if(!err && doc) {
					policy = doc;
					callback();
				} else {
					callback('Policy not found');
				}
			});
		},

		// Generate redeems
		function(callback) {
			var count = 0;
			common.async.until(
				function() {
					return count >= num_codes;
				},
				function(redeem_callback) {
					var redeem = new Redeem({
						policy: policy._id,
						redeemed: false
					});
					redeem.save(function(err, saved){
						if(!err && saved) {
							count++;
						}
						redeem_callback();
					});
				},
				function(err) {
					callback();
				}
			);

		}

	],
	// Finally
	function(err) {
		if(!err) {
			req.flash('success',common.util.format('%d Redeem codes were generated',num_codes));
			res.send({success: true});
		} else {
			res.send({success:false, error: err});
		}
	});
}


// Support
exports.support = function(req, res) {

	var supports = [];

	Support.find({})
	.sort({_id: -1})
	.populate('client')
	.exec(function(err, docs) {
		if(!err && docs){
			supports = docs;
		}
		res.render('admin/support', {supports: supports, getTimestamp: getTimestamp, toPrettyDate: toPrettyDate});
	});
}

exports.support_close = function(req, res) {
	var support_ids = [req.body.support_id];
	if(support_ids) {
		Support.update({
			_id: {
				$in: support_ids
			}
		},
		{
			$set:{
				status: Support.Status.Closed
			}
		},
		{
			multiple: true
		})
		.exec(function(err, docs) {

			if(err) {
				res.send({success: false, error: err});
			} else {
				res.send({success: true});
			}

		});
	} else {
		res.send({succcess: false, error: 'Missing parameters'});
	}
}

/*
* Utils
*/
function getTimestamp(_id) {
	var timehex = String(_id).substring(0,8);
	var secondsSinceEpoch = parseInt(timehex, 16);
	return (secondsSinceEpoch*1000);
}

function toPrettyDate(_id) {
	var timestamp = getTimestamp(_id);
	return common.moment(timestamp).format('YYYY-MM-DD HH:mm');
}
