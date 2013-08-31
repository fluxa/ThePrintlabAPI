
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
	app.post(v+'/client/register', clients.register);
	app.get(v+'/client/get', clients.get);
	app.put(v+'/client/update', clients.update);
	app.delete(v+'/client/remove', clients.remove);
	app.post(v+'/client/coupon/consume', clients.coupon_consume);
	app.get(v+'/client/coupon/get', clients.coupon_get);
	// -> auth
	app.get(v+'/client/find', auth, clients.find);


	// Address
	app.post(v+'/address/register', addresses.register);
	app.get(v+'/address/get', addresses.get);
	app.post(v+'/address/remove', addresses.remove);

	// Order
	app.post(v+'/order/create', orders.create);
	app.put(v+'/order/submit', orders.submit);
	// -> auth
	app.get(v+'/order/status_list', auth, orders.status_list);
	app.get(v+'/order/find', auth, orders.find);
	app.get(v+'/order/all', auth, orders.all);
	app.get(v+'/order/get', auth, orders.get);
	app.delete(v+'/order/remove', auth, orders.remove);


	// redirect all others to the index (HTML5 history)
	app.get('*', index.index);
}
