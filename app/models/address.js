
/*!
 * Module dependencies
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var _ = require('underscore');
var util = require('util');


// ## Address schema

var AddressSchema = new Schema({
	client: {type: Schema.ObjectId, ref: 'Client'},
	name: { type: String },
	last_name: { type: String },
	address_line1: { type: String },
	address_line2: { type: String },
	region: { type: String },
	provincia: { type: String },
	comuna: { type: String },
	removed: { type: Boolean, default: false }
})

AddressSchema.set( 'toJSON', { virtuals: false, getters: true } );


/**
 * Methods
 */

AddressSchema.method({
	verbose : function() {
		return util.format('%s %s\n%s %s\n%s, %s\n%s',
			this.name,
			this.last_name,
			this.address_line1,
			this.address_line2,
			this.comuna,
			this.provincia,
			this.region
		);
	}
})

/**
 * Statics
 */

AddressSchema.static({

})

/**
 * Register
 */

module.exports = mongoose.model('Address', AddressSchema);
