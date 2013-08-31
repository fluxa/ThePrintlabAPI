var nodemailer = require("nodemailer");
var config = require('./config/config')[process.env.NODE_ENV]

// create reusable transport method (opens pool of SMTP connections)
var smtpTransport = nodemailer.createTransport("SMTP",config.mailer);

exports.send = function(mailOptions, callback) {
	smtpTransport.sendMail(mailOptions, function(err, response){
		if(err){
			console.log(err);
			callback(err);
		}else{
			console.log("Message sent: " + response.message);
			callback(null);
		}
	});
}