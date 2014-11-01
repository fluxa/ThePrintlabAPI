
/*!
 * Module dependencies
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;


// ## Schema

var RedeemSchema = new Schema({
	code: { type: String },
	policy: { type: String, ref: 'Policy'},
	redeemed: { type: Boolean, default: false },

	// If redeemed
	client: { type: String, ref: 'Client'},
	date: { type: String }
});

RedeemSchema.set( 'toJSON', { virtuals: false, getters: true } );

/**
 * Add your
 * - pre-save hooks
 * - validations
 * - virtuals
 */
 // Pre-save hook
RedeemSchema.pre('save', function(next) {

	if(this.code) {
		next();
		return;
	}

	var code = this.gen_code();
	var succeeded = false;
	var call_count = 0;
	var redeem = this;

	common.async.whilst(
		function() {
			if(succeeded) {
				return false;
			}
			call_count++;
			code = redeem.gen_code();
			return true;
		},
		function(callback) {
			Redeem
			.count({
				code: code
			})
			.exec(function(err, c) {
				succeeded = (!err && c === 0);
				callback();
			});

		},
		function(err) {
			console.log(common.util.format('Redeem code generated correctly (executed %d times)',call_count));
			redeem.code = code;
			next();
		}
	);

});


/**
 * Methods
 */
RedeemSchema.method({
	gen_code: function() {
		return parseInt(Math.random()*100000000).toString(36).toUpperCase();
	}
});



/**
 * Statics
 */

RedeemSchema.static({

});

/**
 * Register
 */

module.exports = mongoose.model('Redeem', RedeemSchema);
var Redeem = module.exports;
