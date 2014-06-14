
/*!
 * Module dependencies
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;


// ### Model Schema

var EmailSchema = new Schema({
  from: { type:String, default: 'hola@theprintlab.cl' },
  to: { type: String },
  bcc: [ { type: String } ],
  subject: { type: String },
  body: { type: String },
  created_utc: { type: String }, // YYYY-MM-DD HH:mm:ss
  sent: { type: Boolean },
  sent_utc: { type: String }, // YYYY-MM-DD HH:mm:ss
  type: { type: String }, //  Email.Types static
  retries: { type: Number, default: -1 }, // if sending error, retry 10 times
  logs: [ { type: String } ] // response logs
}, { collection: 'emails' })


/**
 * Add your
 * - pre-save hooks
 * - validations
 * - virtuals
 */

/**
 * Methods
 */

EmailSchema.method({

})

/**
 * Statics
 */

EmailSchema.static({
  Types: {
    OrderConfirmation: 'OrderConfirmation',
    OrderConfirmationOffline: 'OrderConfirmationOffline',
    PaymentOfflineNotify: 'PaymentOfflineNotify',
    Support: 'Support',
    MktGuerrilla: 'MarketingGuerrilla'
  },
  RetriesMax: 10
})

/**
 * Register
 */

module.exports = mongoose.model('Email', EmailSchema)
