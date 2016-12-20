
/*!
 * Module dependencies
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Client = require('./client');

// IF VALUES CHANGE, ALSO SYNC IN FRONT_END
var OrderStatus = {
	PaymentPending: 'PAYMENT_PENDING', // default state, set when order create
	PaymentStarted: 'PAYMENT_STARTED', // set when the payment process starts but has not completed
	PaymentVerified: 'PAYMENT_VERIFIED', // set internally after payment has been verified by the provider
	PaymentOffline: 'PAYMENT_OFFLINE', // set for non online payments
	NoNeedPayment: 'NO_NEED_PAYMENT', // when Order total == $0, due to coupon use
	PaymentError: 'PAYMENT_ERROR', // payment was rejected for some reason
	CanceledByUser: 'CANCELED_BY_USER', // the order was canceled by the user
	Submitted: 'SUBMITTED', // set when all elements for the order has been collected and order is ready for next step
	Printing: 'PRINTING', // order was sent for printing
	Shipped: 'SHIPPED', // order was shipped
	Archived: 'ARCHIVED' // order has completed whole cycle and has been archived
}


// ## Order schema

var OrderSchema = new Schema({
	client: { type: String, ref: 'Client'}, // Client _id
	address: { type: String, ref: 'Address' }, // Address _id
	photos: [ { // Array of photos and quantities
		file_name: { type: String },
		qty: { type: Number }
	} ],
	photo_count: { type: Number },
	cost_printing: { type: Number },
	cost_shipping: { type: Number },
	cost_total: { type: Number },
	status: { type: String, default: OrderStatus.PaymentPending},
	gift: {
		is_gift: {type: Boolean, default: false},
		message: {type: String, default: ''}
	},
	coupon_code: { type: String },
	payment: { //payment object
		provider: { type: String, default: '' },
		data: {type: String, default: ''},
		logs: [{ type: String }]
	},
	verbose: { type: String }, //A verbal version of the Order
	updated_utc: { type: String },
  sent_email: { type: Boolean, default: false }, // Wether the notification email was sent to the Client
  sent_bank_transfer_email: { type: Boolean, default: false },
	sent_printing_notification: { type: Boolean, default: false },
	sent_shipped_notification: { type: Boolean, default: false }
})

OrderSchema.set( 'toJSON', { virtuals: false, getters: true } );

/**
 * Add your
 * - pre-save hooks
 * - validations
 * - virtuals
 */
 // ### Order pre remove hook
OrderSchema.pre('remove', function(next) {

	//} Remove Orders from Client
	Client.findOne({_id: this.client}, function(err,doc) {
		if (!err && doc) {
			doc.orders.splice(doc.orders.indexOf(this._id),1);
			doc.save(function(err) {
				if (err) {
					console.log('Order => post remove error => %s',err);
				};
				next();
			});
		} else {
			next();
		}
	});
});

// ### Order post save hook
OrderSchema.post('save', function(saved) {

	//} Add saved Order to Client's orders
	Client.findOne({_id: saved.client}, function(err, doc){
		if(!err && doc) {
			// Only add Order _id one time and save Client
			if(doc.orders.indexOf(saved._id) === -1) {
				doc.orders.push(saved._id);
				doc.save(function(err) {
					if (err) {
						console.log('Order => post save error => %s',err);
					};
				});
			}
		}
	});

});

// ### Order pre save hooks
OrderSchema.pre('save', function(next) {
	this.updated_utc = common.moment().utc().format('YYYY-MM-DD HH:mm:ss');
	next();
});



/**
 * Statics
 */


OrderSchema.static({

	OrderStatus : OrderStatus,
	OrderStatusList : [
		{id: OrderStatus.PaymentPending, name: 'PaymentPending'},
		{id: OrderStatus.PaymentStarted, name: 'PaymentStarted'},
		{id: OrderStatus.NoNeedPayment, name: 'NoNeedPayment'},
		{id: OrderStatus.PaymentVerified, name: 'PaymentVerified'},
		{id: OrderStatus.PaymentOffline, name: 'PaymentOffline'},
		{id: OrderStatus.PaymentError, name: 'PaymentError'},
		{id: OrderStatus.Submitted, name: 'Submitted'},
		{id: OrderStatus.Printing, name: 'Printing'},
		{id: OrderStatus.Shipped, name: 'Shipped'},
	],
	Actions: {
		StartWebpay: 'start_webpay',
		StartStripe: 'start_stripe',
		Complete: 'complete',
		Fail: 'failed'
	},
	PaymentProvider: {
		NoPayment: 'nopayment',
		Webpay: 'webpay',
		Stripe: 'stripe',
		BankTransfer: 'bank_transfer'
	}
})

/**
 * Register
 */

module.exports = mongoose.model('Order', OrderSchema);
