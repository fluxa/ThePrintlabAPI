/*!
 * Module dependencies.
 */

var async = require('async');
var Order = require('../models/order');
var Client = require('../models/client');
var util = require('util');
var _ = require('underscore')

// Reset consumed coupons
exports.coupons_reset = function(req, res) {

	var client_id = req.params.client_id;

	if (client_id) {

		Client.update(
			{
				_id: client_id //query
			},
			{
				consumed_coupons: [] //update
			}
		)
		.exec(function(err, doc) {
			if(err) {
				console.log('coupons_reset error => ' + err || 'unknown');
			}
			res.send({coupons: Client.Coupons});
		})

	};


}
