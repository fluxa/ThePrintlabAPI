
/*!
 * Module dependencies
 */

var mongoose = require('mongoose')
var Schema = mongoose.Schema
var _ = require('underscore');
var util = require('util')


// ## Schema

var SupportSchema = new Schema({
	client: {type: Schema.ObjectId, ref: 'Client'},
	message: { type: String },
	status: { type: String },
	date: { type: Date }
})


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
		New: 'new'
	}
})

/**
 * Register
 */

module.exports = mongoose.model('Support', SupportSchema)