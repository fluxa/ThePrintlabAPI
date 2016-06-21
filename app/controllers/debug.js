/*!
 * Module dependencies.
 */

var async = require('async');
var Order = require('../models/order');
var Client = require('../models/client');
var Coupon = require('../models/coupon');
var util = require('util');
var _ = require('underscore');
var Email = require('../models/email');

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

exports.coupon_test_save = function(req, res) {
	var c = new Coupon();
	c.title = 'test';
	c.description = 'test';
	c.currency = 'CLP';
	c.rules = {
		cost_base: 5000,
		qty_base: 20,
		cost_add: 1000,
		qty_add: 5,
		cost_shipping_flat: 0
	}
	console.log('will save Coupon => %s',c);
	c.save(function(err, saved) {
		res.send('OK');
	})
}

exports.queueup_order_confirm_email = function(req, res) {

	var today = common.moment();
	var orderID = 'TestOrderID';
	var template_locals = {
		order_id: orderID,
		photos_qty: 10,
		cost_printing: 1000,
		cost_shipping: 500,
		cost_total: 1500,
		address_to_name: 'Jon Snow',
		address: 'Winterfell Street 666, Tower 1',
		current_year: today.format('YYYY')
	}
	var template_name = 'order_bank_transfer';
	var to_emails = ['jmfluxa@gmail.com'];
	var subject = common.util.format('ThePrintlab: Pedido Recibido (%s)', orderID);
	var type = Email.Types.OrderConfirmationOffline;
	template_locals.confirm_payment_url = common.util.format('http://www.theprintlab.cl/bktrans?order_id=%s&env=%s',orderID,common.env)

	common.mailqueue.add(
		template_name,
		template_locals,
		null,
		to_emails,
		null,
		subject,
		type,
		function(err, result) {
			res.send('Order Submit emailqueue.add => ' + err || 'SENT');
		}
	);


}
