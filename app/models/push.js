
/*!
 * Module dependencies
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;


// ### Model Schema

var PushSchema = new Schema({
	// Required
	ios_tokens: [ { type: String } ],
	droid_tokens: [ {type: String }],
	message: { type: String, required: true },
	sent: { type: Boolean, default: false },
	// Optional
	badge: { type: Number },

}, { collection: 'pushes' })


/**
 * Add your
 * - pre-save hooks
 * - validations
 * - virtuals
 */

/**
 * Methods
 */

PushSchema.method({

})

/**
 * Statics
 */

PushSchema.static({

})

/**
 * Register
 */

module.exports = mongoose.model('Push', PushSchema);
