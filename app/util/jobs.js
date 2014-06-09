
/*!
 * Module dependencies
 */

var Order = require('../models/order');
var Support = require('../models/support');
var Push = require('../models/push');
var pusher = require('./pusher');

// Send Push notifications
var _send_pushes_is_sending = false;
exports.SendPushes = function() {

	if(_send_pushes_is_sending) {
		console.log('SendPushes busy...');
		return;
	}
	_send_pushes_is_sending = true;

	var pushes = [];

	common.async.series([

		// Pushes
		function(callback) {
			Push
			.find({
				sent: false
			})
			.limit(10)
			.sort({'_id':1})
			.exec(function(err, docs) {
				if (!err && docs) {
					pushes = docs;
					if(pushes.length > 0) {
						console.log('Found %d pushes',pushes.length);
					}
				}
				callback();
			})
		},

		//Send
		function(callback) {
			common.async.eachSeries(pushes, function(push, each_callback) {
				var tokens_i = push.ios_tokens.filter(function(elt) {return elt!=''});
				// var tokens_a = push.droid_tokens.filter(function(elt) {return elt!=''});

        if (tokens_i.length==0 /* && tokens_a.length==0 */) {
  				console.log("No valid device_tokens for this push");
  				push.remove();
  				each_callback();
  				return;
  			}

				// Payload
				var payload = {};
        var audience_arr = [];
        var extra_ios = {};
        // var extra_android = {};

				if (tokens_i.length>0) {
					common._.each(tokens_i, function(token) {
            audience_arr.push({device_token:token});
          });
				}

				// if (tokens_a.length>0) {
				// 	common._.each(tokens_a, function(apid) {
        //    audience_arr.push({apid:apid});
        //  });
				// }

        payload.audience = {"OR":audience_arr};
        payload.notification = {
          alert: push.message,
          ios: {
            badge: push.badge,
            extra: extra_ios
          },
          // android: {
          //   extra: extra_android
          // }
        }
        payload.device_types = 'all';

				console.log('Push Payload: => ' + JSON.stringify(payload));

				pusher.send(payload, function(err){
					if (err) {
						console.log('Push send error => ' + err);
					};
					push.sent = true;
					push.save(function(err, saved) {
						if (err) {
							console.log('Cannot save push');
						};
						each_callback();
					});
				});

			}, function() {
				callback();
			});
		}

	],
	// Finally
	function() {
		//console.log('Push job finished');
		_send_pushes_is_sending = false;
	});

}
