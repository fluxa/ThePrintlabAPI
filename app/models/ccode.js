
/*!
 * Module dependencies
 */

var mongoose = require('mongoose')
var Schema = mongoose.Schema


// ## Schema

var CCodeSchema = new Schema({
	_id: { type: String, required: true },
	coupon: { type: String, ref: 'Coupon'},

});

CCodeSchema.set( 'toJSON', { virtuals: false, getters: true } );

/**
 * Add your
 * - pre-save hooks
 * - validations
 * - virtuals
 */



/**
 * Methods
 */
CCodeSchema.method({
	
});



/**
 * Statics
 */

CCodeSchema.static({
	
});

/**
 * Register
 */

module.exports = mongoose.model('CCode', CCodeSchema)
