
/*!
 * Module dependencies
 */

var mongoose = require('mongoose')
var Schema = mongoose.Schema
var Address = null;
var Order = null;
var _ = require('underscore');

/**
 * Client schema
 */

var ClientSchema = new Schema({
	udid: {type: String}, // unique id generated from the device
	email: {type: String},
	mobile: { type: String },
	uaToken: { type: String },
	coupons: { type: [String] }, // consumed coupon ids
	addresses: { type: [Schema.ObjectId] }, //Address _id
	orders: { type: [Schema.ObjectId] }, //Order _id
	social_accounts: { type: [String] }, //social _id
})


/**
 * Add your
 * - pre-save hooks
 * - validations
 * - virtuals
 */
ClientSchema.post('remove', function(removed) {
	
	console.log('Client post remove: ' + removed._id);
	load_models();

	//remove all Address
	Address.remove({client_id: removed._id}).exec();
	
	//remove all Order
	Order.remove({client_id: removed._id}).exec();
	
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
