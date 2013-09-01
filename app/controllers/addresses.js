/*!
 * Module dependencies.
 */

var mongoose = require('mongoose');
var Address = mongoose.model('Address');
var Order = mongoose.model('Order');
var Client = mongoose.model('Client');
var plerror = require('../../plerror');


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
								res.send(400, plerror.CannotSaveDocument('Address register -> Cannot save Client', null));
							}
						});
					} else {
						res.send(400, plerror.CannotSaveDocument('Address register -> Cannot create Address', err));
					}
				});
			} else {
				res.send(400, plerror.ClientNotFound('Client not found with _id: {0}'.format(payload.client), err));
			}
		});
	} else {
		res.send(400, plerror.MissingParameters('', null))
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
				res.send(400,plerror.AddressNotFound('Address not found for _id: {0}'.format(_id), err))
			}
		});
	} else {
		res.send(400, plerror.MissingParameters('', null))
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
				res.send(400, plerror.AddressNotFound('Address not found for _id: {0}'.format(_id), err))
			};
		});
	} else {
		res.send(400, plerror.MissingParameters('', null))
	}
}