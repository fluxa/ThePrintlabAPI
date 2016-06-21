/*!
 * Module dependencies.
 */

var Email = require('../models/email');
var path = require('path');
var templates_dir   = path.resolve(__dirname, '..', 'views/templates');
var EmailTemplate = require('email-templates').EmailTemplate;


exports.add = function(template_name, template_locals, from_email, to_emails, bcc, subject, type, master_cb) {

  common.async.waterfall([
    function(cb) {
      // Validations
      if(template_name &&
        template_locals &&
        to_emails.length > 0 &&
        subject &&
        common._.indexOf(common._.toArray(Email.Types),type) >= 0
      ) {
        cb();
      } else {
        cb('Missing parameters');
      }
    },

    // Inflate template
    function(cb) {
      var template = new EmailTemplate(path.join(templates_dir, template_name));
      template.render(template_locals, cb);
    },

    // Create and Save Email objects
    function(template, cb) {
      var emails = [];
      common.async.eachLimit(to_emails, 1, function(to_email, next) {
        var email = new Email({
          to: to_email,
          bcc: bcc,
          subject: subject,
          body: template.html,
          created_utc: common.moment().utc().format('YYYY-MM-DD HH:mm:ss'),
          sent: false,
          type: type
        });

        if(from_email) {
          email.from = from_email;
        }

        email.save(function(err, saved) {
          if(!err) {
            emails.push(saved);
            console.log('mailqueue.add success => Email type: %s to %s subject: %s',saved.type,saved.to,saved.subject);
          } else {
            console.log('mailqueue.add error => %s | For email type: %s identifier: %s to: %s subject: %s',err,type,identifier,subject);
          }
          next();
        });

      },
      // Finally
      function() {
        cb(null, emails);
      });
    }

  ],
  // Finally
  function(err, result) {
      master_cb(err, result);
  });

}
