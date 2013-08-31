/*!
 * Module dependencies.
 */

var mongoose = require('mongoose');
var Address = mongoose.model('Address');
var Order = mongoose.model('Order');
var Client = mongoose.model('Client');


// ### Registers a new Address for a Client 
// - @param {Object} `{ payload: {client_id:'xxx', address: {}}`
// - @return {Object} `{address: {}, client: {}}`
// - @method `POST`

exports.register = function (req, res) {

	var payload = req.body.payload;
	var address = payload.address;
	if (payload && payload.client_id && address) {
		
		//} First we try to find the Client
		Client.findOne({_id: payload.client_id}, function(err, doc) {
			if (!err && doc) {
				var client = doc;
				address['client_id'] = client._id;
				//} And we create the Address
				Address.create(address, function(err, doc) {
					if (!err) {
						client.addresses.push(doc._id);
						client.save(function(err){
							if(!err) {
								res.send({address: doc, client: client});
							} else {
								res.send(400, {error: err || 'Cannot save Client'});
							}
						});
					} else {
						res.send(400, {error: err || 'Cannot create Address'});
					}
				});
			} else {
				res.send(400, {error: err || 'Client not found'});
			}
		});
	} else {
		res.send(400,{error:'missing parameters'})
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
				res.send(400,{error: err || 'no Address found'})
			}
		});
	} else {
		res.send(400,{error:'missing parameters'})
	}
}



// ### Remove and Address from database
// - @param {String} `_id` of the Address to remove
// - @return {Object} `{address:{}}` Address object
// - @method `DELETE`

exports.remove = function (req, res) {
	
	var _id = req.body._id;
	if (_id) {
		Address.findOne({_id: _id}, function(err, doc) {
			if (!err && doc) {
				doc.remove();
				res.send({address:doc});
			} else {
				res.send(400,{error: err || 'Address not found for _id: {0}'.format(_id)});
			};
		});
	} else {
		res.send(400,{error:'missing parameters'})
	}
}