
/*!
 * Module dependencies
 */

var mongoose = require('mongoose')
var Schema = mongoose.Schema


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
		cost_base: { type: Number, required: true },
		qty_base: { type: Number, required: true },
		cost_add: { type: Number, required: true },
		qty_add: { type: Number, required: true },
		cost_shipping_flat: { type: Number, required: true }
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
	pack: function() {
		return {
			code: this._id,
			title: this.title,
			desc: this.description,
			rules: this.rules
		}
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

module.exports = mongoose.model('Coupon', CouponSchema)
