
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

module.exports = function (app) {

  var auth = passport.authenticate('basic', { session: false });

	// Routes
	app.get('/', auth, index.admin);
	app.get('/mu-c480b215-1f18b692-ac11b7c3-2db78a1a', index.blitz);
	app.get('/v1/ping', index.ping_v1);
  app.get('/v2/ping', index.ping);
	app.get('/v1/ping/server', index.ping_server);

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
	app.get('/v1/logs', auth, index.logs);

	// Client
	app.post('/v1/clients/register', clients.register);
  app.post('/v2/clients', clients.register);

	app.get('/v1/clients/get/:_id', clients.get);
  app.get('/v2/clients/:_id', clients.get);

	app.post('/v1/clients/update', clients.update_deprec);
  app.post('/v2/clients/:_id', clients.update);

	app.delete('/v1/clients/remove/:_id', clients.remove);
	app.post('/v1/clients/pushtoken', clients.pushtoken);


	// -> auth
	app.post('/v1/clients/find/', auth, clients.find);

	// Coupons
	app.get('/v1/coupons/get/:client_id', coupons.get);
  app.get('/v2/clients/:client_id/coupons', coupons.get);

	app.post('/v1/coupons/consume', coupons.consume);
	app.post('/v1/coupons/redeem', coupons.redeem);

	//Deprecated - Backwards compatibility
	app.post('/v1/clients/coupon/consume', coupons.consume);
	app.get('/v1/clients/coupon/get/:client_id', coupons.get);

	// Address
  app.post('/v1/addresses/register', addresses.register_deprec);
  app.post('/v2/clients/:_id/addresses', addresses.register);

	app.get('/v1/addresses/get/:_id', addresses.get);
  app.get('/v2/addresses/:_id', addresses.get);

	app.delete('/v1/addresses/remove/:_id', addresses.remove);
  app.delete('/v2/addresses/:_id', addresses.remove);

	// Order
	app.get('/v1/orders/get/:_id', orders.get);
	app.post('/v1/orders/create', orders.create);
	app.post('/v1/orders/submit', orders.submit);

	app.post('/v1/orders/cancel/:_id', orders.cancel);
  app.post('/v2/orders/:_id/cancel', orders.cancel);

  app.post('/v1/order/:_id/payment/offline/confirmation', orders.payment_offline_confirmation);

	// -> auth
	app.get('/v1/orders/status_list', auth, orders.status_list);
	app.post('/v1/orders/find', auth, orders.find);
	app.get('/v1/orders/all', auth, orders.all);
	app.post('/v1/orders/payment/:_id/:action', auth, orders.payment);
	app.delete('/v1/orders/remove/:_id', auth, orders.remove);

	// Support
	app.post('/v1/support/send_message', support.send_message);

	// Debug
	if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
		console.log('DEBUG ROUTES ON');
		app.post('/v1/debug/coupons/reset/:client_id', debug.coupons_reset);
    app.get('/debug/coupon/test_save', debug.coupon_test_save);
    app.get('/debug/emails/queueorderconfirm', debug.queueup_order_confirm_email);
	};

}
