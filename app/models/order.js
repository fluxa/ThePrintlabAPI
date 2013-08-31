
/*!
 * Module dependencies
 */

var mongoose = require('mongoose')
var Schema = mongoose.Schema
var Client = null
var _ = require('underscore');

var OrderStatus = {
	PaymentPending: 'PAYMENT_PENDING', //set when registered and waiting for payment
	PaymentError: 'PAYMENT_ERROR', //payment was rejected for some reason
	PaymentAccepted: 'PAYMENT_ACCEPTED', //payment was accepted but still needs verification
	PaymentVerified: 'PAYMENT_VERIFIED', //payment is completed
	Printing: 'PRINTING', //order was sent for printing
	Shipped: 'SHIPPED' //order was shipped
}


// ## Order schema

var OrderSchema = new Schema({
	client: {type: Schema.ObjectId, ref: 'Client'}, // Client _id
	address: { type: Schema.ObjectId, ref: 'Address' }, // Address _id
	photo_ids: { type: [String] }, // Array of photo_id Strings: photo_uid + '_' + qty
	photo_count: { type: Number },
	cost_printing: { type: Number },
	cost_shipping: { type: Number },
	cost_total: { type: Number },
	status: { type: String, default: OrderStatus.PaymentPending},
	gift: {
		is_gift: {type: Boolean},
		message: {type: String}
	},
	payment: { //payment object
		verification_code: {type: String},
		message: {type: String}
	},
	verbose: {type: String} //A verbal version of the Order
})


/**
 * Add your
 * - pre-save hooks
 * - validations
 * - virtuals
 */
 // ### Order post remove hook
OrderSchema.post('remove', function(removed) {
	
	load_models();

	//} Remove removeed Order from Client
	Client.findOne({_id: this.client}, function(err,doc) {
		console.log(err);
		if (!err && doc) {
			doc.orders.splice(doc.orders.indexOf(removed._id),1);
			doc.save();
		};
	});
});

// ### Order post save hook
OrderSchema.post('save', function(saved) {
	
	load_models();

	//} Add saved Order to Client's orders
	Client.findOne({_id: saved.client}, function(err, doc){
		if(!err && doc) {
			// Only add Order _id one time and save Client
			if(doc.orders.indexOf(saved._id) === -1) {
				doc.orders.push(saved._id);
				doc.save();
			}
		}
	});
	
});

/**
 * Methods
 */

OrderSchema.method({

})

/**
 * Statics
 */

OrderSchema.static({
	
	OrderStatus : OrderStatus,
	OrderStatusList : [
		{id: OrderStatus.PaymentPending, name: 'PaymentPending'},
		{id: OrderStatus.PaymentError, name: 'PaymentError'},
		{id: OrderStatus.PaymentAccepted, name: 'PaymentAccepted'},
		{id: OrderStatus.PaymentVerified, name: 'PaymentVerified'},
		{id: OrderStatus.Printing, name: 'Printing'},
		{id: OrderStatus.Shipped, name: 'Shipped'},
	]
})

/**
 * Register
 */

module.exports = mongoose.model('Order', OrderSchema)

/**
* Helpers
*/
function load_models(){
	if (Client == null) {
		Client = mongoose.model('Client');
	};
}

