
/*!
 * Module dependencies
 */

var mongoose = require('mongoose')
var Schema = mongoose.Schema
var Client = require('./client')
var _ = require('underscore');

var OrderStatus = {
	PaymentPending: 'PAYMENT_PENDING', //set when registered and waiting for payment
	PaymentError: 'PAYMENT_ERROR', //payment was rejected for some reason
	PaymentAccepted: 'PAYMENT_ACCEPTED', //payment was accepted but still needs verification
	PaymentVerified: 'PAYMENT_VERIFIED', //payment is completed
	Printing: 'PRINTING', //order was sent for printing
	Shipped: 'SHIPPED' //order was shipped
}

/**
 * Order schema
 */

var OrderSchema = new Schema({
	client_id: {type: Schema.ObjectId}, //Client _id
	shipping_address_id: { type: Schema.ObjectId }, //Address _id
	photo_ids: { type: [String] }, //photoId is: uid + '_' + qty
	photo_count: { type: Number }, //total number of photos to print
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
OrderSchema.post('remove', function(removed) {
	
	console.log('Order post remove');

	var self = this;

	//remove from Client
	Client.findOne({_id: this.client_id}, function(err,doc) {
		if (!err && doc) {
			console.log('orders before: ' + doc.orders.length);
			doc.orders = _.without(doc.orders,[self._id]);
			console.log('orders after: ' + doc.orders.length);
			doc.save();
		};
	});
});

OrderSchema.post('save', function(saved) {
	
	console.log('Order post save');

	//add Order to Client
	Client.findOne({_id: saved.client_id}, function(err, doc){
		if(!err && doc) {
			if(_.indexOf(doc.orders,saved._id) == -1) {
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
