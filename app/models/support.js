
/*!
 * Module dependencies
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var _ = require('underscore');
var util = require('util')


// ## Schema

var SupportSchema = new Schema({
	client: { type: String, ref: 'Client' },
	message: { type: String },
	status: { type: String },
	replied: { type: Boolean, default: false }
})

SupportSchema.set( 'toJSON', { virtuals: false, getters: true } );

/**
 * Add your
 * - pre-save hooks
 * - validations
 * - virtuals
 */



/**
 * Methods
 */



/**
 * Statics
 */

SupportSchema.static({
	Status: {
		New: 'NEW',
		Open: 'OPEN',
		Closed: 'CLOSED'
	}
})

/**
 * Register
 */

module.exports = mongoose.model('Support', SupportSchema);
