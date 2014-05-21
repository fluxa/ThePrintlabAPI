/*!
 * Module dependencies.
 */

var Email = require('../models/email');
var path = require('path');
var templates_dir   = path.resolve(__dirname, '..', 'views/templates');
var emailTemplates = require('email-templates');

exports.add = function(template_name, template_locals, to_emails, subject, type, callback) {

  common.async.waterfall([
    function(callback) {
      // Validations
      if(template_name &&
        template_locals &&
        to_emails.length > 0 &&
        subject &&
        common._.indexOf(common._.toArray(Email.Types),type) >= 0
      ) {
        callback();
      } else {
        callback('Missing parameters');
      }
    },

    // Templates
    function(callback) {
      emailTemplates(templates_dir, callback);
    },

    // Inflate template
    function(templates, callback) {
      templates(template_name, template_locals, callback);
    },

    // Create and Save Email objects
    function(html, text, callback) {
      var emails = [];
      common.async.eachLimit(to_emails, 1, function(to_email, each_callback) {
        var email = new Email({
          to: to_email,
          subject: subject,
          body: html,
          created_utc: common.moment().utc().format('YYYY-MM-DD HH:mm:ss'),
          sent: false,
          type: type
        });
        email.save(function(err, saved) {
            if(!err) {
              emails.push(saved);
              console.log('mailqueue.add success => Email type: %s to %s subject: %s',saved.type,saved.to,saved.subject);
            } else {
              console.log('mailqueue.add error => %s | For email type: %s identifier: %s to: %s subject: %s',err,type,identifier,subject);
            }
            each_callback();
        })

      },
      // Finally
      function() {
          callback(null, emails);
      });
    }

  ],
  // Finally
  function(err, result) {
      callback(err, result);
  });

}
