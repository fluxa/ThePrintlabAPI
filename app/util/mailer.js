// /*!
//  * Module dependencies.
//  */

var mongoose = require('mongoose');
var nodemailer = require('nodemailer');
var path = require('path');
var templatesDir   = path.resolve(__dirname, '..', 'views/templates');
var emailTemplates = require('email-templates');
var Email = mongoose.model('Email');


// create reusable transport method (opens pool of SMTP connections)
var smtpTransport = nodemailer.createTransport('SMTP', common.config.smtp_options);

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

var _is_proccesing_queue = false;
var QUEUE_BUSY_ERROR = 'mailer.process_queue => is busy';
exports.process_queue = function(master_callback) {

  common.async.waterfall([

      function(callback) {
        if(!_is_proccesing_queue) {
          _is_proccesing_queue = true;
          callback();
        } else {
          callback(QUEUE_BUSY_ERROR);
        }
      },

      function(callback) {
        Email
        .find({
          sent: false,
          retries: {
            $lt: Email.RetriesMax
          }
        })
        .sort({
          _id: 1
        })
        .limit(10)
        .exec(callback)
      },

      function(emails, callback) {
        common.async.eachLimit(emails, 1, function(email, each_callback) {

          var message = new sendgrid.Email({
            from: email.from,
            to: email.to,
						bcc: email.bcc,
            subject: email.subject,
            html: email.body
          });

          console.log('mailer.process_queue sending => Email to %s with subject: %s',message.to,message.subject);

          email.retries++;
          email.save();

          smtpTransport.sendMail(message, function(err, response){
            var log;

            if(!err){
              log = common.util.format('Sent with response => %s', response.message);
              email.sent = true;
              email.sent_utc = common.moment().utc().format('YYYY-MM-DD HH:mm:ss');
              console.log('mailer.process_queue success => Email to %s %s marked as sent', message.to, log);
            } else {
              log = common.util.format('Retry %d | Error => %s',email.retries, JSON.stringify(err));
              console.log('mailer.process_queue error => Email to %s %s', message.to, log);
            }

            email.logs.push(log);
            email.save(function(err, saved) {
              each_callback();
            });

          });
        },
        // Finally
        function() {
          console.log('mailer.process_queue => Finished processing each email address from %d queued emails',emails.length);
          callback();
        });
      }
    ],
    // Finally
    function(err) {
      if(err === QUEUE_BUSY_ERROR) {
        console.log('mailer.proccess_queue => still busy... ');
      } else {
        _is_proccesing_queue = false;
      }
      if(master_callback) {
          master_callback(err);
      }
    }
  );
}
