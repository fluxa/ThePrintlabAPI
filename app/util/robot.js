/*!
 * Module dependencies.
 */


var MailListener = require('mail-listener2')
var config = require('../../config/config')[process.env.NODE_ENV];

exports.start = function() {
	mail_listener();
}

// Listening to emails sent to 'robot@theprintlab.cl'
 function mail_listener() {

	var mailListener = new MailListener({
		username: config.robot_smtp.auth.user,
		password: config.robot_smtp.auth.pass,
		host: 'imap.gmail.com',
		port: 993,
		tls: true,
		tlsOptions: { rejectUnauthorized: false },
		mailbox: "INBOX", // mailbox to monitor
		markSeen: true, // all fetched email willbe marked as seen and not fetched next time
		fetchUnreadOnStart: true, // use it only if you want to get all unread email on lib start. Default is `false`,
		mailParserOptions: {streamAttachments: false} // options to be passed to mailParser lib.
	})

	mailListener.start();
	mailListener.on('server:connected', function(){
		console.log('Imap Connected: ' + config.robot_smtp.auth.user);
	});

	mailListener.on('server:disconnected', function(){
		console.log('Imap Disconnected: ' + config.robot_smtp.auth.user);
	});

	mailListener.on('error', function(err){
		console.log(err);
	});

	mailListener.on('mail', function(mail){

		

		if(mail.to[0].address === 'robot@theprintlab.cl') {
			console.log('We got a message to robot!');
			console.log(mail.subject);

			// mailListener.imap.move(471, '[Gmail]/Trash', function(err){
			// 	if(err) {
			// 		console.log('imap move err => ' + err);
			// 	}
			// 	console.log('trashed!');
			// });

			// mailListener.imap.addFlags(mail['headers']['message-id'], 'SEEN', function(err){
			// 	if(err) {
			// 		console.log('imap flagged err => ' + err);
			// 	}
			// 	console.log('flagged!');

			// 	//console.log(mail);
			// });

			// mailListener.imap.getBoxes('', function(err, boxes){
			// 	if(err) {
			// 		console.log('imap getBoxes err => ' + err);
			// 	}
			// 	console.log(boxes);
			// });

			// mailListener.imap.openBox('[Gmail]/Trash', true, function(err, mailbox){
			// 	if(err) {
			// 		console.log('imap openBox err => ' + err);
			// 	}
			// 	console.log(mailbox);
			// });

			// mailListener.imap.search(['UNSEEN'], function(err, uids){
			// 	if(err) {
			// 		console.log('imap search err => ' + err);
			// 	}
			// 	console.log(uids);
			// });

		}
	});


}