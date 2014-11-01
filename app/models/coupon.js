
/*!
 * Module dependencies
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;


// ## Schema

// App Uses this schema
// code: 'FIRST_TIME_5FREE',
// title: 'En tu primera compra, te regalamos el envío!',
// desc:'Para que pruebes nuestro servicio de impresión con envío a tu casa',
// rules: {
// 	cost_base: 5000,
// 	qty_base: 20,
// 	cost_add: 1000,
// 	qty_add: 5,
// 	cost_shipping_flat: 0
// }

var CouponSchema = new Schema({
	title: { type: String, required: true },
	description: { type: String, required: true },
	rules: {
		cost_base: { type: Number },
		qty_base: { type: Number },
		cost_add: { type: Number },
		qty_add: { type: Number },
		cost_shipping_flat: { type: Number }
	},
	currency: { type: String, required: true }
});

CouponSchema.set( 'toJSON', { virtuals: false, getters: true } );

/**
 * Add your
 * - pre-save hooks
 * - validations
 * - virtuals
 */



/**
 * Methods
 */
CouponSchema.method({

	// Return coupon in the format of the App
	pack: function(code) {
		return {
			code: code,
			title: this.title,
			desc: this.description,
			rules: this.rules
		};
	},

	// Validate rule
	isValid: function(qty, cost_total) {
		var _additional = Math.max(0, qty - this.rules.qty_base);
		var _cost_printing = this.rules.cost_base + this.rules.cost_add * Math.ceil(_additional/this.rules.qty_add);
		var _cost_shipping = this.rules.cost_shipping_flat;
		var _cost_total = _cost_printing + _cost_shipping;

		if(_cost_total === cost_total) {
			return true;
		}

		return false;
	}
});



/**
 * Statics
 */

CouponSchema.static({
	Currencies: {
		CLP: 'CLP',
		USD: 'USD'
	}
});

/**
 * Register
 */

module.exports = mongoose.model('Coupon', CouponSchema);
