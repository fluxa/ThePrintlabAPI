
/*!
 * Module dependencies.
 */

var mongoose = require('mongoose')
var Support = mongoose.model('Support')
var Client = mongoose.model('Client')
var plerror = require('../util/plerror');
var util = require('util')


/**
 * Send support message
 *
 * @param {String} client_id {_id:'xxx'}
 * @param {String} email
 * @param {String} message
 * @method `POST`
 * @api public
 */
exports.send_message = function(req, res) {
	
	var client_id = req.body.client_id;
	var email = req.body.email;
	var message = req.body.message;

	if (client_id && message) {

		Client.findOne({_id: client_id}).exec(function(err, doc) {
			if (!err && doc) {
				// Update email if necessary
				if (!doc.email && email) {
					doc.email = email;
					doc.save();
				};
				var support = new Support({client: doc._id, message: message});
				support.status = Support.Status.New;
				support.save(function(err, saved) {
					if (!err) {
						res.send({success: true});
					} else {
						plerror.throw(plerror.c.DBError, err, res);
					}
				});
			} else {
				plerror.throw(plerror.c.DBError, err || 'Client not found', res);
			}
		});
	} else {
		plerror.throw(plerror.MissingParameters, 'Missing parameters client_id, message', res);
	}

}
