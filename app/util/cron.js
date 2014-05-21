/*!
 * Module dependencies.
 */

var cronjob = require('cron').CronJob;

var util = require('util');
var jobs = require('./jobs');
var mailer = require('./mailer');

var _cronjobs = {};

var _jobs = [
	{
		name: 'Order Confirmation Email',
		cronTime: '0 */5 * * * *', // every 5 minutes
		onTick: jobs.OrderConfirmationEmail,
		onComplete:function(){_cronjobs['orderconfirmationemail'].start();},
		start: true,
		id: 'orderconfirmationemail'
	},
	{
		name: 'Support Notification Email',
		cronTime: '0 */5 * * * *', // every 5 minutes
		onTick: jobs.SupportNotificationEmail,
		onComplete:function(){_cronjobs['suportnotificationemail'].start();},
		start: true,
		id: 'suportnotificationemail'
	},
  {
    name: 'Order Bank Transfer Email',
    cronTime: '30 */1 * * * *', // every 5 minutes
    onTick: jobs.OrderBankTransferEmail,
    onComplete:function(){_cronjobs['orderbanktransferemail'].start();},
    start: true,
    id: 'orderbanktransferemail'
  },
  {
    name: 'Email Queue',
    cronTime: '50 */1 * * * *', // every 1 minute
    onTick: mailer.process_queue,
    start: true,
    id: 'emailqueue'
  }
];

exports.schedule = function() {
	_jobs.map(function(job) {
		_cronjobs[job.id] = new cronjob(job);
		console.log(util.format('%s cronjob scheduled at %s',job.name, job.cronTime));
	});
}
