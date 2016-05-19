/*!
 * Module dependencies.
 */

var mongoose = require('mongoose');
var Address = require('../models/address');
var Order = require('../models/order');
var Client = require('../models/client');
var plerror = require('../util/plerror');
var util = require('util')

// ### Registers a new Address for a Client
// - @param {Object} `{client:'ObjectId', address: {}`
// - @return {Object} `{address: {}, client: {}}`
// - @method `POST`
exports.register = function(req, res) {

	var errorCode = plerror.c.DBError;

	common.async.waterfall([
		function(cb) {
			var clientId = req.params._id;
			return Client.findOne({_id: clientId}).exec(cb);
		},
		function(client, cb) {
			if(client && req.body.address) {
				var address = new Address(req.body.address);
				address.client = client._id;
				return address.save(function(err, saved) {
					return cb(err, client, address);
				});
			}
			errorCode = plerror.c.MissingParameters;
			return cb('Missing parameters');
		},
		function(client, address, cb) {
			client.addresses.push(address._id);
			return client.save(function(err, saved) {
				cb(err, {client:saved, address:address});
			});
		}
	], function(err, output) {
		if(err) {
			return plerror.throw(errorCode, err, res);
		}

		return res.send(output);
	});

};

// ### Registers a new Address for a Client
// - @param {Object} `{ payload: {client:'ObjectId', address: {}}`
// - @return {Object} `{address: {}, client: {}}`
// - @method `POST`

exports.register_deprec = function (req, res) {

	var payload = req.body.payload;
	var address = payload.address;
	if (payload && payload.client && address) {

		//} First we try to find the Client
		Client.findOne({_id: payload.client}, function(err, doc) {
			if (!err && doc) {
				var client = doc;
				address['client'] = client._id;
				//} And we create the Address
				Address.create(address, function(err, doc) {
					if (!err) {
						client.addresses.push(doc._id);
						client.save(function(err){
							if(!err) {
								res.send({address: doc, client: client});
							} else {
								plerror.throw(plerror.c.DBError, err, res);
							}
						});
					} else {
						plerror.throw(plerror.c.DBError, err, res);
					}
				});
			} else {
				plerror.throw(plerror.c.ClientNotFound, err || util.format('Client not found with _id: %s',payload.client), res);
			}
		});
	} else {
		plerror.throw(plerror.c.MissingParameters, 'Missing parameters payload, address', res);
	}
}



// ### Gets an Address by _id
// - @param {String} `_id`
// - @return {Object} `{address: {}}` Address object
// - @method `GET`
// - @api `public`
// @Deprecated

exports.get = function (req, res) {

	var _id = req.params['_id'];
	if (_id) {
		Address.findOne({_id:_id}, function(err, doc) {
			if(!err && doc) {
				res.send({address:doc});
			} else {
				plerror.throw(plerror.c.AddressNotFound, err || util.format('Address not found for _id: %s',_id), res);
			}
		});
	} else {
		plerror.throw(plerror.c.MissingParameters, 'Missing parameters _id', res);
	}
}


// ### Remove and Address from database
// - @param {String} `_id` of the Address to remove
// - @return {Object} `{address:{}}` Address object
// - @method `DELETE`
// - @api `public`

exports.remove = function (req, res) {

	var _id = req.params['_id'];
	if (_id) {
		Address.findOne({_id: _id}, function(err, doc) {
			if (!err && doc) {

				var address = doc;
				address.removed = true;
				address.save();

				//} Remove Address from Client
				Client.findOne({_id: doc.client}, function(err,client) {
					if (!err && client) {
						client.addresses.splice(client.addresses.indexOf(address._id),1);
						client.save();
					};
					res.send({address:address});
				});

			} else {
				plerror.throw(plerror.c.AddressNotFound, err || util.format('Address not found for _id: %s',_id), res);
			};
		});
	} else {
		plerror.throw(plerror.c.MissingParameters, 'Missing parameters _id', res);
	}
}
