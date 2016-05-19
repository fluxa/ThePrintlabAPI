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
    name: 'Email Queue',
    cronTime: '30 */1 * * * *', // every 1 minute
    onTick: mailer.process_queue,
    start: true,
    id: 'emailqueue'
  },
  // {
	// 	name: 'Push Notifications',
	// 	cronTime: '*/10 * * * * *', // every 10 seconds
	// 	onTick: jobs.SendPushes,
	// 	start: true,
	// 	id: 'pushes'
	// }
];

exports.schedule = function() {
	_jobs.map(function(job) {
		_cronjobs[job.id] = new cronjob(job);
		console.log(util.format('%s cronjob scheduled at %s',job.name, job.cronTime));
	});
}
