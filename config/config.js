
/*!
 * Module dependencies.
 */

var path = require('path')
var rootPath = path.resolve(__dirname + '../..')
var util = require('util')

// Current version (user-agent)
var minimum_app_version_allowed = 'ThePrintlab/1.5';

/**
 * Expose config
 */

module.exports = {
	root: rootPath,
	db: process.env.MONGOLAB_URI,
	smtp_options: {
		auth: {
			user: process.env.SMTP_AUTH_USER,
			pass: process.env.SMTP_AUTH_PASS
		}
	},
	master: process.env.MASTER_KEY,
	admin_emails: ['fluxa@theprintlab.cl', 'luis@theprintlab.cl'],
	minimum_app_version_allowed: minimum_app_version_allowed,
	auth: {
		user: process.env.BASIC_USER,
		pass: process.env.BASIC_PASS
	},
	less_force_compile: false
}
