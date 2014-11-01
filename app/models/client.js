
/*!
 * Module dependencies
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Address = require('./address');
var Order = require('./order');
var _ = require('underscore');


// ## Client schema

var ClientSchema = new Schema({
	udid: { type: String, index: { unique: true } }, // unique id generated from the device
	email: {type: String},
	mobile: { type: String },
	pushtoken: {
		token: { type: String },
		platform: { type: String }
	},
	consumed_coupons: [{ type: String }], // consumed coupon ids
	addresses: [ { type: String , ref: 'Address'} ] , //Address _id
	orders: [ { type: String , ref: 'Order'} ], //Order _id
	social_accounts: [{ type: String }], //social _id
  updated_utc: { type: String }
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

	//} Remove all Address
	Address.remove({client: removed._id}).exec();

	//} Remove all Order
	Order.remove({client: removed._id}).exec();

});

// ### Client pre save hooks
ClientSchema.pre('save', function(next) {

	this.updated_utc = common.moment().utc().format('YYYY-MM-DD HH:mm:ss');

	// lowercase emails
	if(this.email) {
		this.email = this.email.toLowerCase();
	}

	next();
});


/**
 * Statics
 */

ClientSchema.static({
	// Coupon Policy
	// 0: Give Away
	// 1: Only in Special (special_coupons)
	Coupons : [
		// {
		// 	code: 'FIRST_TIME_5FREE',
		// 	title: 'Te regalamos 5 fotos gratis, incluyendo costos de envío',
		// 	desc:'Para que pruebes nuestro servicio de impresión con envío a tu casa',
		// 	reminder_all_selected: 'RECUERDA QUE SIEMPRE PUEDES SELECCIONAR MÁS FOTOS POR UN VALOR MÍNIMO Y APROVECHAR EL COSTO DE ENVÍO GRATIS!!',
		// 	rules: {
		// 		cost_base: 0,
		// 		qty_base: 5,
		// 		cost_add: 1000,
		// 		qty_add: 5,
		// 		cost_shipping_flat: 0
		// 	},
		// 	policy: 0
		// },
		{
			code: 'FIRST_TIME_5FREE',
			title: 'En tu primera compra, te regalamos el envío!',
			desc:'Para que pruebes nuestro servicio de impresión con envío a tu casa',
			rules: {
				cost_base: 5000,
				qty_base: 20,
				cost_add: 1000,
				qty_add: 5,
				cost_shipping_flat: 0
			},
			policy: 0
		},
		{
			code: '20131223_200_1',
			title: 'Cupón de Pedido',
			desc:'Puedes elegir hasta un máximo de 200 impresiones. Las primeras 5 impresiones y costos de envío son gratis. Luego se te cobrará $1.000 por cada 5 impresiones adicionales.',
			rules: {
				cost_base: 0,
				qty_base: 200,
				cost_add: 1000,
				qty_add: 5,
				cost_shipping_flat: 0
			},
			policy: 1
		}
	]
})

/**
 * Register
 */

module.exports = mongoose.model('Client', ClientSchema);
