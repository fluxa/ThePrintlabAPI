
/*!
 * Module dependencies
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Client = null;
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
 * Add your
 * - pre-save hooks
 * - validations
 * - virtuals
 */

// WE ARE NOT REMOVING ADDRESS ANYMORE, JUST SETTING removed = true

// ### Address post remove
// AddressSchema.post('remove', function(removed) {

// 	load_models();

// 	//} Remove Address from Client
// 	Client.findOne({_id: this.client}, function(err,doc) {
// 		if (!err && doc) {
// 			doc.addresses.splice(doc.addresses.indexOf(removed._id),1);
// 			doc.save();
// 		};
// 	});

// });


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

/**
* Helpers
*/
// function load_models(){
// 	if (Client == null) {
// 		Client = mongoose.model('Client');
// 	};
// }
