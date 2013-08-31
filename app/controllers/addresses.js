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
								console.log(err);
								res.send(400, plerror.CannotSaveDocument('Address register -> Cannot save Client'));
							}
						});
					} else {
						console.log(err);
						res.send(400, plerror.CannotSaveDocument('Address register -> Cannot create Address'));
					}
				});
			} else {
				console.log(err);
				res.send(400, plerror.ClientNotFound('Client not found with _id: {0}'.format(payload.client)));
			}
		});
	} else {
		res.send(400, plerror.MissingParameters(''))
	}
}



// ### Gets an Address by _id
// - @param {String} `_id`
// - @return {Object} `{address: {}}` Address object
// - @method `GET`

exports.get = function (req, res) {

	var _id = req.query._id;
	if (_id) {
		Address.findOne({_id:_id}, function(err, doc) {
			if(!err && doc) {
				res.send({address:doc});
			} else {
				console.log(err);
				res.send(400,plerror.AddressNotFound('Address not found for _id: {0}'.format(_id)))
			}
		});
	} else {
		res.send(400, plerror.MissingParameters(''))
	}
}



// ### Remove and Address from database
// - @param {String} `_id` of the Address to remove
// - @return {Object} `{address:{}}` Address object
// - @method `DELETE`

exports.remove = function (req, res) {
	console.log(req.body);
	var _id = req.body._id;
	if (_id) {
		Address.findOne({_id: _id}, function(err, doc) {
			if (!err && doc) {
				doc.remove();
				res.send({address:doc});
			} else {
				console.log(err);
				res.send(400, plerror.AddressNotFound('Address not found for _id: {0}'.format(_id)))
			};
		});
	} else {
		res.send(400, plerror.MissingParameters(''))
	}
}