
/**
 * Module dependencies.
 */

var mongoose = require('mongoose')

// controllers
var clients = require('clients')
var addresses = require('addresses')
var orders = require('orders')
var index = require('index')

/**
 * Expose
 */

var v = '/v1';

module.exports = function (app, auth) {

	// Routes
	app.get('/', auth, index.index);
	app.get('/partial/:name', auth, index.partial);
	app.get('/mu-c480b215-1f18b692-ac11b7c3-2db78a1a', index.blitz);
	app.get(v+'/ping', index.ping);

	// -> auth
	app.get(v+'/logs', auth, index.logs);
	
	// Client
	app.post(v+'/clients/register', clients.register);
	app.get(v+'/clients/get/:_id', clients.get);
	app.post(v+'/clients/update', clients.update);
	app.delete(v+'/clients/remove/:_id', clients.remove);
	app.post(v+'/clients/coupon/consume', clients.coupon_consume);
	app.get(v+'/clients/coupon/get/:_id', clients.coupon_get);
	// -> auth
	app.post(v+'/clients/find/', auth, clients.find);


	// Address
	app.post(v+'/addresses/register', addresses.register);
	app.get(v+'/addresses/get/:_id', addresses.get);
	app.delete(v+'/addresses/remove/:_id', addresses.remove);

	// Order
	app.post(v+'/orders/create', orders.create);
	app.post(v+'/orders/submit', orders.submit);
	// -> auth
	app.get(v+'/orders/status_list', auth, orders.status_list);
	app.post(v+'/orders/find', auth, orders.find);
	app.get(v+'/orders/all', auth, orders.all);
	app.get(v+'/orders/get/:_id', auth, orders.get);
	app.get(v+'/orders/payment/:_id/:action', auth, orders.payment);
	app.delete(v+'/orders/remove/:_id', auth, orders.remove);

}
