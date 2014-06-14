
/*!
 * Module dependencies.
 */

var mongoose = require('mongoose');
var Support = mongoose.model('Support');
var Client = mongoose.model('Client');
var Email = mongoose.model('Email');
var plerror = require('../util/plerror');
var util = require('util');


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

		Client
		.findOne({
			_id: client_id
		})
		.exec(function(err, doc) {
			if (!err && doc) {

				var client = doc;

				// Update email if necessary
				if (!client.email && email) {
					client.email = email;
					client.save();
				}

				var support = new Support({
					client: doc._id,
					message: message
				});

				support.status = Support.Status.Open;

				support.save(function(err, saved) {
					if (!err) {
						res.send({
							success: true
						});

						// Queue email
						var today = common.moment();
						var template_name = 'support';
						var locals = {
							client_id: client._id,
							support_id: support._id,
							message: support.message,
							email: client.email,
							mobile: client.mobile,
							date: today.format('YYYY-MM-DD HH:mm'),
							current_year: today.format('YYYY')
						}

						var subject = common.util.format('[ThePrintlab Support] (%s)', support._id);
						var bcc = [];

						common.mailqueue.add(
							template_name,
							locals,
							client.email,
							common.config.admin_emails,
							bcc,
							subject,
							Email.Types.Support,
							function(err, result) {
								console.log('Support mailqueue.add => %s',err || 'SENT');
							}
						);

					} else {
						plerror.throw(plerror.c.DBError, err, res);
					}
				});
			} else {
				plerror.throw(plerror.c.DBError, err || 'Client not found', res);
			}
		});
	} else {
		plerror.throw(plerror.c.MissingParameters, 'Missing parameters client_id, message', res);
	}

}
