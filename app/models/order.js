
/*!
 * Module dependencies
 */

var mongoose = require('mongoose')
var Schema = mongoose.Schema
var Client = null
var _ = require('underscore');
var time = require('time')

var OrderStatus = {
	PaymentPending: 'PAYMENT_PENDING', // set when order is submitted but payment has not started
	PaymentStarted: 'PAYMENT_STARTED', // set when the payment process starts but is not completed
	PaymentError: 'PAYMENT_ERROR', // payment was rejected for some reason
	PaymentCompleted: 'PAYMENT_COMPLETED', // set when the payment has been successfully complete
	Printing: 'PRINTING', // order was sent for printing
	Shipped: 'SHIPPED' // order was shipped
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
	verbose: {type: String}, //A verbal version of the Order
	updated_at: {type: Date}
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

// ### Order pre save hooks
OrderSchema.pre('save', function(next) {
	this.updated_at = new time.Date().setTimezone('UTC');
	next();
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
		{id: OrderStatus.PaymentStarted, name: 'PaymentStarted'},
		{id: OrderStatus.PaymentError, name: 'PaymentError'},
		{id: OrderStatus.PaymentCompleted, name: 'PaymentCompleted'},
		{id: OrderStatus.Printing, name: 'Printing'},
		{id: OrderStatus.Shipped, name: 'Shipped'},
	],
	OrderActions: {
		Start: 'start',
		Complete: 'complete'
	},
	OrderDebugging: {
		client: 'TEST',
		cost_total: 650000
	}
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

