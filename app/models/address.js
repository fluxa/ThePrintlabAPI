
/*!
 * Module dependencies
 */

var mongoose = require('mongoose')
var Schema = mongoose.Schema
var Client = require('./client')
var _ = require('underscore');

/**
 * Address schema
 */

var AddressSchema = new Schema({
	client_id: {type: Schema.ObjectId},
	name: { type: String },
	last_name: { type: String },
	address_line1: { type: String },
	address_line2: { type: String },
	region: { type: String },
	provincia: { type: String },
	comuna: { type: String },
})


/**
 * Add your
 * - pre-save hooks
 * - validations
 * - virtuals
 */
AddressSchema.post('remove', function(removed) {
	
	console.log('Address post remove');

	//remove from Client
	Client.findOne({_id: this.client_id}, function(err,doc) {
		if (!err && doc) {
			doc.addresses = doc.addresses.splice(doc.addresses.indexOf(removed._id),1);
			doc.save();
		};
	});
	
});


/**
 * Methods
 */

AddressSchema.method({
	verbose : function() {
		return '{0} {1}\n{2} {3}\n{4}, {5}\n{6}'.format(
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

module.exports = mongoose.model('Address', AddressSchema)
