// /*!
//  * Module dependencies.
//  */

var nodemailer = require('nodemailer');
var path = require('path');
var templatesDir   = path.resolve(__dirname, '..', 'views/templates');
var emailTemplates = require('email-templates');
var config = require('../../config/config')[process.env.NODE_ENV];

// create reusable transport method (opens pool of SMTP connections)
var smtpTransport = nodemailer.createTransport("SMTP", config.smtp_options);

exports.send = function(template_name, template_locals, from_email, to_email, bcc, subject, callback) {

	//get templates
	emailTemplates(templatesDir, function(err, template) {

		if (!err) {

			//get specific template
			template(template_name, template_locals, function(err, html, text) {
				
				if (!err) {
					//composing email
					var mailOptions = {
						from: from_email,
						to: to_email,
						bcc: bcc,
						subject: subject,
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