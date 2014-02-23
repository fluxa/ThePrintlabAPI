
/*!
 * Module dependencies.
 */

var mongoose = require('mongoose')
var Client = mongoose.model('Client')
var plerror = require('../util/plerror')
var util = require('util')
var security = require('../util/security')

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
					plerror.throw(plerror.c.DBError, err, res);
				}
			});
		});
	} else {
		plerror.throw(plerror.MissingParameters, 'Missing parameters udid', res);
	}
}

/**
 * Gets a Client by _id
 *
 * - @param {String} _id from Client
 * - @return {Object} Client object
 * - @method `GET`
 * - @api public
 */
exports.get = function (req, res) {

	var _id = req.params['_id'];
	if (_id) {
		Client.findOne({_id:_id}, function(err, doc) {
			if(!err && doc) {
				res.send({client:doc});
			} else {
				plerror.throw(plerror.ClientNotFound, err || util.format('Client not found with _id: %s',_id), res);
			}
		});
	} else {
		plerror.throw(plerror.MissingParameters, 'Missing parameters _id', res);
	}
}


// ### Find Clients by {query:{'prop':'value'}}
// - @param {Object} query in the form {'prop':'value'}
// - @return {Array} array of Client objects
// - @method `POST`
// - @api private
exports.find = function (req, res) {

	var  query = req.body.query;
	if (query) {
		Client.find(query, function(err, docs) {
			if(!err) {
				res.send({clients:docs});
			} else {
				plerror.throw(plerror.c.DBError, err, res);
			}
		});
	} else {
		plerror.throw(plerror.MissingParameters, 'Missing parameters query', res);
	}
}


/**
 * Updates Client information
 *
 * @param {Object} client partial Client object with updated fields
 * @return {Object} updated Client object
 * - @method `POST`
 * @api public
 */
exports.update = function (req, res) {

	var client = req.body.client;
	if (client && client._id) {
		var _id = client._id;
		delete client._id;
		Client.findByIdAndUpdate(_id, client, function(err, doc) {
			if (!err && doc) {
				res.send({client:doc});
			} else {
				plerror.throw(plerror.c.ClientNotFound, err || util.format('Client not found with _id: %s',client._id), res);
			};
		});
	} else {
		plerror.throw(plerror.MissingParameters, 'Missing parameters client', res);
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

	var _id = req.params['_id'];
	if (_id) {
		Client.findOne({_id: _id}, function(err, doc) {
			if (!err && doc) {
				doc.remove();
				res.send({success:true});
			} else {
				plerror.throw(plerror.c.ClientNotFound, err || util.format('Client not found with _id: %s',_id), res);
			}
		});
	} else {
		plerror.throw(plerror.MissingParameters, 'Missing parameters _id', res);
	}
}
