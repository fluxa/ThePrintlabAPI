
/*!
 * Module dependencies
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;


// ## Schema


var PolicySchema = new Schema({
	name: { type: String, required: true },
	type: { type: String, required: true },
	coupon: { type: String, ref:'Coupon'},
	expiry_date: { type: String, required: true },
	active: { type: Boolean, default: false },
	target_clients: [ { type: String, ref: 'Client' }]
});

PolicySchema.set( 'toJSON', { virtuals: false, getters: true } );

/**
 * Add your
 * - pre-save hooks
 * - validations
 * - virtuals
 */

// ### Pre save hooks
// PolicySchema.pre('save', function(next) {

// });


/**
 * Statics
 */

PolicySchema.static({
	Types: {
		GLOBAL: { sorting_priority: 3, key: 'GLOBAL', desc: 'Automatically assigned to ALL Clients' },
		SPECIFIC: { sorting_priority: 2, key: 'SPECIFIC', desc: 'Automatically assigned to target Clients' },
		REDEEMABLE: { sorting_priority: 1, key: 'REDEEMABLE', desc: 'Assigned only when redeemed by coupon code' }
	}
});

/**
 * Register
 */

module.exports = mongoose.model('Policy', PolicySchema);
