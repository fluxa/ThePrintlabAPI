/*!
 * Module dependencies.
 */

var mongoose = require('mongoose');
var Address = mongoose.model('Address');
var Order = mongoose.model('Order');
var Client = mongoose.model('Client');


/**
 * Registers a new Address for a Client
 *
 * @param {Object} payload in the form { payload: {client_id:'xxx', address: {}}
 * @return {Object} {address: Address, client: Client} 
 * @api private
 */
exports.register = function (req, res) {

	//console.log(req.body);
	var payload = req.body.payload;
	var address = payload.address;
	if (payload && payload.client_id && address) {
		
		Client.findOne({_id: payload.client_id}, function(err, doc) {
			if (!err && doc) {
				var client = doc;
				address['client_id'] = client._id;
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

/**
 * Gets an Address by _id
 *
 * @param {String} _id from Address
 * @return {Object} address Address object
 * @api public
 */
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


/**
 * Remove and Address from database
 *
 * @param {String} _id of the Address to remove
 * @return {String} _id of the Address removed | 400 Error
 * @api public
 */
exports.remove = function (req, res) {
	
	var _id = req.body._id;
	if (_id) {
		Address.findOne({_id: _id}, function(err, doc) {
			if (!err && doc) {
				doc.remove();
				res.send({success:true});
			} else {
				res.send(400,{error: err || 'Order not found for _id: {0}'.format(_id)});
			};
		});
	} else {
		res.send(400,{error:'missing parameters'})
	}
}