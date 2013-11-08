/*!
 * Module dependencies.
 */

// var cronJob = require('cron').CronJob;
// var async = require('async');
// var Order = require('../models/order');
// var util = require('util');
// var config =  require('../../config/config')[process.env.NODE_ENV];
// var _ = require('underscore')
// var mailer = require('./mailer')

// // Daily updates
// function _jobOrderEmalNotification() {
	
// 	console.log('_jobOrderEmalNotification started');

// 	// Stop calling this job until we finish
// 	this.stop();

// 	// Results
// 	var orders = [];

// 	async.series([

// 		// 1. Get Orders where Client hasn't been notified
// 		function(callback) {
			
// 			Order.find({
// 				status: Order.OrderStatus.Submitted,
// 				sent_email: false
// 			})
// 			.limit(10)
// 			.sort({_id:1})
// 			.populate('client')
// 			.exec(function(err, docs) {
// 				if (!err && docs) {
// 					orders = docs;
// 				};
// 				callback(null, 'got orders');
// 			});
// 		}
// 	],
// 	// Finally.
// 	function(err, results) {
// 		// Send notifications
// 		async.eachLimit(orders, 5, function(order, callback) {



// 		}, function(err) {
// 			// Done!
// 			console.log('_jobOrderEmalNotification finished');
// 		});
		
// 	});
// }

// var _cronJobs = {};

// var _jobs = [
// 	{
// 		name: 'KN Updates',
// 		cronTime: '*/60 * * * *', // every 60 minutes
// 		onTick: _jobDoKNUpdates,
// 		start: true,
// 		id: 'knupdates'
// 	},
// 	{
// 		name: 'Push Notifications',
// 		cronTime: '*/10 * * * * *', // every 10 seconds
// 		onTick: _jobSendPushes,
// 		onComplete:function(){_cronJobs['pushes'].start();},
// 		start: true,
// 		id: 'pushes'
// 	},
// 	{
// 		name: 'Booking Reminders',
// 		cronTime: '0 */10 * * * *', // every 10 minutes
// 		onTick: _jobFindBookingReminders,
// 		start: true,
// 		id: 'bookingreminders'
// 	},
// ];

// exports.schedule = function() {
// 	_jobs.map(function(job) {
// 		_cronJobs[job.id] = new cronJob(job);
// 		console.log(util.format('%s cronjob scheduled at %s',job.name, job.cronTime));
// 	});
// }

// _jobDoKNUpdates();