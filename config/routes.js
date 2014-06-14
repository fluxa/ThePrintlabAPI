
/**
 * Module dependencies.
 */

var mongoose = require('mongoose');

// controllers
var clients = require('clients');
var addresses = require('addresses');
var orders = require('orders');
var index = require('index');
var support = require('support');
var coupons = require('coupons');
var debug = require('debug');
var admin = require('admin');
var mktg = require('mktguerrilla');
var maintenance = require('maintenance');
var passport = require('passport');

/**
 * Expose
 */

var v = '/v1';

module.exports = function (app) {

  var auth = passport.authenticate('basic', { session: false });

	// Routes
	app.get('/', auth, index.admin);
	app.get('/mu-c480b215-1f18b692-ac11b7c3-2db78a1a', index.blitz);
	app.get(v+'/ping', index.ping);
	app.get(v+'/ping/server', index.ping_server);

	// Admin
	app.get('/admin/dashboard', auth, admin.dashboard);
	app.get('/admin/orders', auth, admin.orders);
	app.get('/admin/clients', auth, admin.clients);
	app.get('/admin/coupons', auth, admin.coupons);
	app.get('/admin/policies', auth, admin.policies);
  app.get('/admin/mktguerrilla', auth, mktg.index);
	app.get('/admin/support', auth, admin.support);
	app.post('/admin/orders/manage', auth, admin.orders_manage);
	app.post('/admin/orders/export', auth, admin.orders_export);
	app.post('/admin/support/close', auth, admin.support_close);
	app.post('/admin/coupons/add', auth, admin.coupons_add);
	app.post('/admin/policies/add', auth, admin.policies_add);
	app.post('/admin/policies/active', auth, admin.policies_active);
	app.get('/admin/policies/manage_codes/:_id', auth, admin.policies_manage_codes);
	app.post('/admin/policies/generate_codes', auth, admin.policies_generate_codes);
  app.post('/admin/mktguerrilla/cans/add', auth, mktg.cans_add);
  app.get('/admin/mktguerrilla/canned/:_id/remove', auth, mktg.canned_remove);
  app.post('/admin/mktguerrilla/attack', auth, mktg.attack);
  app.get('/admin/mktguerrilla/emails/:limit', auth, mktg.emails);

	// Maintenance
	app.get('/maintenance/fix_consumed',auth,maintenance.fix_consumed);

	// -> auth
	app.get(v+'/logs', auth, index.logs);

	// Client
	app.post(v+'/clients/register', clients.register);
	app.get(v+'/clients/get/:_id', clients.get);
	app.post(v+'/clients/update', clients.update);
	app.delete(v+'/clients/remove/:_id', clients.remove);
	app.post(v+'/clients/pushtoken', clients.pushtoken);

	// -> auth
	app.post(v+'/clients/find/', auth, clients.find);

	// Coupons
	app.get(v+'/coupons/get/:client_id', coupons.get);
	app.post(v+'/coupons/consume', coupons.consume);
	app.post(v+'/coupons/redeem', coupons.redeem);

	//Deprecated - Backwards compatibility
	app.post(v+'/clients/coupon/consume', coupons.consume);
	app.get(v+'/clients/coupon/get/:client_id', coupons.get);

	// Address
	app.post(v+'/addresses/register', addresses.register);
	app.get(v+'/addresses/get/:_id', addresses.get);
	app.delete(v+'/addresses/remove/:_id', addresses.remove);

	// Order
	app.get(v+'/orders/get/:_id', orders.get);
	app.post(v+'/orders/create', orders.create);
	app.post(v+'/orders/submit', orders.submit);
	app.post(v+'/orders/cancel/:_id', orders.cancel);
  app.post(v+'/order/:_id/payment/offline/confirmation', orders.payment_offline_confirmation);

	// -> auth
	app.get(v+'/orders/status_list', auth, orders.status_list);
	app.post(v+'/orders/find', auth, orders.find);
	app.get(v+'/orders/all', auth, orders.all);
	app.post(v+'/orders/payment/:_id/:action', auth, orders.payment);
	app.delete(v+'/orders/remove/:_id', auth, orders.remove);

	// Support
	app.post(v+'/support/send_message', support.send_message);

	// Debug
	if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
		console.log('DEBUG ROUTES ON');
		app.post(v+'/debug/coupons/reset/:client_id', debug.coupons_reset);
	};


}
