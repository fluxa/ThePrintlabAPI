/*!
 * Module dependencies.
 */

var nodemailer = require('nodemailer');
var path = require('path');
var templatesDir   = path.resolve(__dirname, '..', 'views/templates');
var emailTemplates = require('email-templates');
var config = require('../../config/config')[process.env.NODE_ENV];

// create reusable transport method (opens pool of SMTP connections)
var smtpTransport = nodemailer.createTransport("SMTP", config[process.env.NODE_ENV].smtp_options);

exports.send = function(payload, callback) {

	//get templates
	emailTemplates(templatesDir, function(err, template) {

		if (!err) {

			var today = new Date();

			// template locals
			var locals = {
				toemail: payload.to_email,
				subject: payload.subject,
				preheader: payload.subject,
				link: payload.link,
				current_year: today.getFullYear()
			}
			
			//get specific template
			template('email', locals, function(err, html, text) {
				
				if (!err) {
					//composing email
					var mailOptions = {
						from: payload.from_email,
						to: payload.to_email,
						subject: payload.subject,
						html: html,
						//generateTextFromHTML: false
					}

					//send email
					smtpTransport.sendMail(mailOptions, function(err, response){
						if(!err){
							callback(null, response.message);
						}else{
							callback(err, null);
						}
					});
				} else {
					callback(err, null);
				}
			});	
		} else {
			callback(err, null);
		}
	});
}