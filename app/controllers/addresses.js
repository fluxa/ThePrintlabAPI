/*!
 * Module dependencies.
 */

var mongoose = require('mongoose');
var Address = mongoose.model('Address');
var Order = mongoose.model('Order');
var Client = mongoose.model('Client');
var plerror = require('../util/plerror');
var util = require('util')


// ### Registers a new Address for a Client 
// - @param {Object} `{ payload: {client:'ObjectId', address: {}}`
// - @return {Object} `{address: {}, client: {}}`
// - @method `POST`

exports.register = function (req, res) {

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
		plerror.throw(plerror.MissingParameters, 'Missing parameters payload, address', res);
	}
}



// ### Gets an Address by _id
// - @param {String} `_id`
// - @return {Object} `{address: {}}` Address object
// - @method `GET`
// - @api `public`

exports.get = function (req, res) {

	var _id = req.params['_id'];
	if (_id) {
		Address.findOne({_id:_id}, function(err, doc) {
			if(!err && doc) {
				res.send({address:doc});
			} else {
				plerror.throw(plerror.AddressNotFound, err || util.format('Address not found for _id: %s',_id), res);
			}
		});
	} else {
		plerror.throw(plerror.MissingParameters, 'Missing parameters _id', res);
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
				doc.remove();
				res.send({address:doc});
			} else {
				plerror.throw(plerror.AddressNotFound, err || util.format('Address not found for _id: %s',_id), res);
			};
		});
	} else {
		plerror.throw(plerror.MissingParameters, 'Missing parameters _id', res);
	}
}