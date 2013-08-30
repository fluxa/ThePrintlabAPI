
/*!
 * Module dependencies.
 */

var mongoose = require('mongoose')
var Client = mongoose.model('Client')

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
					res.send(400,{error: err})
				}
			});
		});
	} else {
		res.send(400,{error:'missing parameters'})
	}
}

/**
 * Gets a Client by _id
 *
 * @param {String} _id from Client
 * @return {Object} Client object
 * @api public
 */
exports.get = function (req, res) {

	var _id = req.query._id;
	if (_id) {
		Client.findOne({_id:_id}, function(err, doc) {
			if(!err && doc) {
				res.send({client:doc});
			} else {
				res.send(400,{error: err || 'no Client found'})
			}
		});
	} else {
		res.send(400,{error:'missing parameters'})
	}
}

/**
 * Find Clients by {query:{'prop':'value'}}
 *
 * @param {Object} query in the form {'prop':'value'}
 * @return {Array} array of Client objects
 * @api private
 */
exports.find = function (req, res) {

	var  query = req.query.query;
	if (query) {
		Client.find(query, function(err, docs) {
			if(!err) {
				res.send({clients:docs});
			} else {
				res.send(400,{error:err})
			}
		});
	} else {
		res.send(400,{error:'missing parameters'})
	}
}


/**
 * Updates Client information
 *
 * @param {Object} client partial Client object with updated fields
 * @return {Object} updated Client object
 * @api public
 */
exports.update = function (req, res) {

	var client = req.body.client;
	if (client && client._id) {
		var _id = client._id;
		delete client._id;
		Client.findByIdAndUpdate(_id, client, function(err, doc) {
			if (!err) {
				res.send({client:doc});
			} else {
				res.send(400,{error:err});
			};
		});
	} else {
		res.send(400,{error:'missing parameters'})
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

	var _id = req.body._id;
	if (_id) {
		Client.findOne({_id: _id}, function(err, doc) {
			if (!err && doc) {
				doc.remove();
				res.send({success:true});
			} else {
				res.send(400,{error: err || 'Client not found for _id: {0}'.format(_id)});
			}
		});
	} else {
		res.send(400,{error:'missing parameters'})
	}
}


/**
 * Try to consume a cupon code
 *
 * @param {Object} payload { payload:{client_id:'xxx', coupon_id:'xxx'} }
 * @return {String} 200 OK | 400 Error
 * @api public
 */
exports.coupon_consume = function (req, res) {

	var payload = req.body.payload;
	if (payload && payload.client_id && payload.coupon_id) {
		Client.findOne({_id: payload.client_id}, function(err, doc) {
			if (!err && doc) {
				var client = doc;
				var consumed = client.coupons.indexOf(payload.coupon_id);
				if(consumed < 0) {
					client.coupons.push(payload.coupon_id);
					client.save();
					res.send({client:client});
				} else {
					res.send(400,{error:'coupon_id {0} already consumed by Client {1}'.format(payload.coupon_id,payload.client_id)});
				}
			} else {
				res.send(400,{error: err || 'no Client found'});
			};
		});
	} else {
		res.send(400,{error:'missing parameters'})
	}
}

/**
 * Returns a list of coupons available (not consumed) by the Client
 *
 * @param {String} _id {_id:'xxx'}
 * @return {Array} array of coupons
 * @api public
 */
exports.coupon_get = function (req, res) {

	var _id = req.query._id;
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
				res.send({coupons: coupons, client_id: client._id});
			} else {
				res.send(400,{error: err || 'no Client found'});
			};
		});
	} else {
		res.send(400,{error:'missing parameters'})
	}
}