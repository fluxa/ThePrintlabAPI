// /*!
//  * Module dependencies.
//  */

var mongoose = require('mongoose');
var sendgrid = require('sendgrid')(common.config.sendgrid.apiKey);
var path = require('path');
var Email = require('../models/email');

exports.process_queue = function (master_callback) {
    common.async.waterfall([
            function (callback) {
                Email
                    .find({ sent: false, retries: { $lt: Email.RetriesMax } })
                    .sort({ _id: 1})
                    .limit(10)
                    .exec(callback)
            },

            function (emails, callback) {
                common.async.eachLimit(emails, 1, function (email, each_callback) {

                        console.log('mailer.process_queue sending => Email to %s with subject: %s', email.to, email.subject);
                        email.retries++;
                        email.save();

                        let request = sendgrid.emptyRequest({
                            method: 'POST',
                            path: '/v3/mail/send',
                            body: {
                                personalizations: [
                                    {
                                        to: [ { email: email.to } ],
                                        subject: email.subject
                                    }
                                ],
                                from: { email: email.from },
                                content: [ { type: 'text/html', value: email.body } ]
                            }
                        });

                        if (email.bcc) {
                            request.body.personalizations[0].bcc = [ { email: email.bcc } ];
                        }
                        
                        sendgrid.API(request)
                            .then((response) => {
                                log = common.util.format('Sent with response => %s', JSON.stringify(response.body));
                                email.sent = true;
                                email.sent_utc = common.moment().utc().format('YYYY-MM-DD HH:mm:ss');
                                console.log('mailer.process_queue success => Email to %s %s marked as sent', email.to, log);
                                email.logs.push(log);
                                email.save(() => {
                                    each_callback();
                                });
                            })
                            .catch((err) => {
                                log = common.util.format('Retry %d | Error => %s', email.retries, JSON.stringify(err));
                                console.log('mailer.process_queue error => Email to %s %s', email.to, log);
                                email.logs.push(log);
                                email.save(() => {
                                    each_callback();
                                });
                            });

                    },
                    // Finally
                    function () {
                        console.log('mailer.process_queue => Finished processing each email address from %d queued emails', emails.length);
                        callback();
                    });
            }
        ],
        // Finally
        function (err) {
            if (master_callback) {
                master_callback(err);
            }
        }
    );
}
