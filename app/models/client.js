
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
	coupons: { type: [String] }, // consumed coupon ids
	addresses: { type: [Schema.ObjectId] , ref: 'Address'}, //Address _id
	orders: { type: [Schema.ObjectId] , ref: 'Order'}, //Order _id
	social_accounts: { type: [String] }, //social _id
	updated_at: {type: Date}
})


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
			code: 'FIRSTTIME_5FREE', 
			title: 'Imprime 5 fotos gratis!', 
			desc:'Para que pruebes nuestro servicio, te regalamos 5 impresiones incluyendo costos de envío en tu primera compra.'
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
