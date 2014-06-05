
/*!
 * Module dependencies
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;


// ### Model Schema

var CannedSchema = new Schema({
  subject: { type: String, default: 'The Printlab' },
  body: { type: String, default: '' },
  short: { type: String, default: '' } // max 120 chars

}, { collection: 'cans' })


/**
 * Add your
 * - pre-save hooks
 * - validations
 * - virtuals
 */

/**
 * Methods
 */

CannedSchema.method({

})

/**
 * Statics
 */

CannedSchema.static({

})

/**
 * Register
 */

module.exports = mongoose.model('Canned', CannedSchema);
