
/*!
 * Module dependencies
 */

var mongoose = require('mongoose')
var Schema = mongoose.Schema
var Address = null
var Order = null
var _ = require('underscore');
var time = require('time');


// ## Client schema

var ClientSchema = new Schema({
	udid: { type: String, index: { unique: true } }, // unique id generated from the device
	email: {type: String},
	mobile: { type: String },
	uaToken: { type: String },
	consumed_coupons: [{ type: String }], // consumed coupon ids
	addresses: [ { type: String , ref: 'Address'} ] , //Address _id
	orders: [ { type: String , ref: 'Order'} ], //Order _id
	social_accounts: [{ type: String }], //social _id
	updated_at: {type: Date}
})

ClientSchema.set( 'toJSON', { virtuals: false, getters: true } );

/**
 * Add your
 * - pre-save hooks
 * - validations
 * - virtuals
 */

 // ### Client post remove hooks
ClientSchema.post('remove', function(removed) {
	
	load_models();

	//} Remove all Address
	Address.remove({client: removed._id}).exec();
	
	//} Remove all Order
	Order.remove({client: removed._id}).exec();
	
});

// ### Client pre save hooks
ClientSchema.pre('save', function(next) {
	this.updated_at = new time.Date().setTimezone('UTC');
	next();
});

/**
 * Methods
 */

ClientSchema.method({

})

/**
 * Statics
 */

ClientSchema.static({
	Coupons : [
		{
			code: 'FIRST_TIME_5FREE', 
			title: 'Te regalamos 5 fotos gratis, incluyendo costos de envío', 
			desc:'Para que pruebes nuestro servicio de impresión con envío a tu casa',
			rules: {
				cost_base: 0,
				qty_base: 5,
				cost_add: 1000,
				qty_add: 5,
				cost_shipping_flat: 0
			}
		}
	]
})

/**
 * Register
 */

module.exports = mongoose.model('Client', ClientSchema)

/**
* Helpers
*/
function load_models(){
	if (Address == null) {
		Address = mongoose.model('Address');
	};

	if (Order == null) {
		Order = mongoose.model('Order');
	};
}
