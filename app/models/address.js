
/*!
 * Module dependencies
 */

var mongoose = require('mongoose')
var Schema = mongoose.Schema
var Client = null
var _ = require('underscore');


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
})


/**
 * Add your
 * - pre-save hooks
 * - validations
 * - virtuals
 */

 // ### Address post remove
AddressSchema.post('remove', function(removed) {
	
	load_models();
	
	//} Remove Address from Client
	Client.findOne({_id: this.client}, function(err,doc) {
		if (!err && doc) {
			console.log('before -> ' + doc.addresses);
			doc.addresses.splice(doc.addresses.indexOf(removed._id),1);
			console.log('after -> ' + doc.addresses);
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

/**
* Helpers
*/
function load_models(){
	if (Client == null) {
		Client = mongoose.model('Client');
	};
}

