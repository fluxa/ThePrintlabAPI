var mongoose = require('mongoose');
var db = mongoose.connection;
var conf = require('./conf');
var plerr = require('./err');

var options = {
  db: { native_parser: false },
  server: { poolSize: 5 },
}

var clientSchema = mongoose.Schema({
    deviceIdentifier: String,
    email: String,
    mobile: String,
    uaToken: String,
    coupons: [String], // consumed coupon ids
    addresses: [String], //Address _id
    orders: [String], //Order _id
    socialAccounts: [String] //social _id
});

var addressSchema = mongoose.Schema({
	clientId: String,
    name: String,
    lastName: String,
    addressLine1: String,
    addressLine2: String,
    region: String,
    provincia: String,
    comuna: String
});

var addressVerbose = function() {
	return '{0} {1}\n{2} {3}\n{4}, {5}\n{6}'.format(
		this.name, 
		this.lastName, 
		this.addressLine1,
		this.addressLine2,
		this.comuna,
		this.provincia,
		this.region
	);
}

var orderSchema = mongoose.Schema({
    clientId: String, //Client _id
   	shippingAddressId: String, //Address _id
   	photoIds: [String], //photoId is: uid + '_' + qty
   	photoCount: Number, //total number of photos to print
   	costPrinting: Number,
   	costShipping: Number,
   	costTotal: Number,
   	status: String,
   	gift: {
   		isGift: Boolean,
   		message: String
   	},
   	payment: { //payment object
   		verificationCode: String,
   		error: String
   	},
   	verbose: String //A verbal version of the Order
});

var Client = mongoose.model('Client', clientSchema);
var Address = mongoose.model('Address', addressSchema);
var Order = mongoose.model('Order', orderSchema);

var _uri = "";

//order statuses
var OrderStatus = {
	PaymentPending: 'PAYMENT_PENDING', //set when registered and waiting for payment
	PaymentError: 'PAYMENT_ERROR', //payment was rejected for some reason
	PaymentAccepted: 'PAYMENT_ACCEPTED', //payment was accepted but still needs verification
	PaymentVerified: 'PAYMENT_VERIFIED', //payment is completed
	Printing: 'PRINTING', //order was sent for printing
	Shipped: 'SHIPPED' //order was shipped
}

//data for dropdown
var OrderStatusList = [
	{id: OrderStatus.PaymentPending, name: 'PaymentPending'},
	{id: OrderStatus.PaymentError, name: 'PaymentError'},
	{id: OrderStatus.PaymentAccepted, name: 'PaymentAccepted'},
	{id: OrderStatus.PaymentVerified, name: 'PaymentVerified'},
	{id: OrderStatus.Printing, name: 'Printing'},
	{id: OrderStatus.Shipped, name: 'Shipped'},
];

exports.connect = function() {

	_uri = mongoURL(conf.server.mongo());

	db.on('error', function callback(err) {
		console.log("mongodb error: " + err);
	});

	db.once('open', function callback () {
		console.log('mongodb ready!');
	});

	console.log("mongo connecting to: " + _uri);

	mongoose.connect(_uri, options);

}

//CRUD helpers

function _find(model, query, callback) { //this function shouldn't be accessible without credentials
	var name = 'n: {0} | f: {1} '.format(this.__parent_line, this.__parent_function_name);
	model.find(query, function(err, docs) {
		if(err) {
			logerr(name, model, query, err);
			callback(err, null);
		} else {
			callback(null, docs);
		}
	});
}

function _findOne(model, query, callback) {
	var name = 'n: {0} | f: {1} '.format(this.__parent_line, this.__parent_function_name);
	model.findOne(query, function(err, doc) {
		if (err) {
			logerr(name, model, query, err);
			callback(err, null);
		} else {
			callback(null, doc);
		}
	});
}

function _remove(model, _id, callback) {
	var name = 'n: {0} | f: {1} '.format(this.__parent_line, this.__parent_function_name);
	model.findByIdAndRemove(_id, function(err,doc) {
		if (!err) {
			callback(null, doc);
		} else {
			logerr(name, model, _id, err);
			callback(err, null);
		}
	});
}

function _update(model, update, callback) {
	var name = 'n: {0} | f: {1} '.format(this.__parent_line, this.__parent_function_name);
	var _id = update._id;
	delete update._id;
	model.findByIdAndUpdate(_id, update, function(err, doc) {
		if (!err) {
			callback(null, doc);
		} else {
			logerr(name, model, update, err);
			callback(err, null);
		};
	});
}

//TRANSACTIONS
//t(query, callback)
// calback = function(err,docs)

//Client
exports.client = {
	find: function(query, callback) { //returns array
		_find(Client, query, callback);
	},
	register: function(query, callback) {
		var name = 'n: {0} | f: {1} '.format(this.__parent_line, this.__parent_function_name);
		//try to find client first
		_findOne(Client, {deviceIdentifier: query}, function(err, doc) {
			if(!err && doc) {
				//Client found, return
				callback(null, doc);
				return;
			}

			// client not found -> register new
			var newClient = new Client({
				deviceIdentifier: query
			});
			newClient.save(function(err, newuser) {
				if (!err) {
					callback(null, newClient);
				} else {
					logerr(name, Client, query, err);
					callback(err, null);
				}
			});
			}
		);
	},
	update: function(update, callback) {
		_update(Client, update, callback);
	},
	remove: function(_id, callback) { //remove Client and all its Addresses 
		var name = 'n: {0} | f: {1} '.format(this.__parent_line, this.__parent_function_name);
		//first remove Client
		_remove(
			Client, 
			_id, 
			function(err, doc) {
				if (!err) {
					console.log('{0} -> Client removed _id: {1}'.format(name, _id));
					//remove addresses
					_find(Address, {clientId:doc._id}, function(err, docs) {
						if(!err) {
							var l = docs.length;
							for (var i = l - 1; i >= 0; i--) {
								var address = docs[i];
								address.remove();
							};
							console.log('{0} -> {1} Addresses removed for Client _id: {2}'.format(name, l, _id));
						} else {
							logerr(name, Address, doc._id, err);
						}
					});

					//remove orders
					_find(Order, {clientId:doc._id}, function(err, docs) {
						if(!err) {
							var l = docs.length;
							for (var i = l - 1; i >= 0; i--) {
								var order = docs[i];
								order.remove();
							};
							console.log('{0} -> {1} Orders removed for Client _id: {2}'.format(name, l, _id));
						} else {
							logerr(name, Order, doc._id, err);
						}
					});

					//call it OK
					callback(null, 'OK');

				} else {
					logerr(name, Client, _id, err);
					callback(err, null);
				}
			}
		);
	}
};

// Address
exports.address = {
	register: function(payload, callback) {
		var name = 'n: {0} | f: {1} '.format(this.__parent_line, this.__parent_function_name);
		var _id = payload._id;
		var address = payload.address;
		_findOne(Client, {_id:_id}, function(err, doc){
			if (!err && doc) {
				//got Client now create Address
				var client = doc;
				address['clientId'] = _id;
				Address.create(address, function(err, doc) {
					if (!err) {
						client.addresses.push(doc._id);
						client.save(function(err){
							if(!err) {
								callback(null, {address: doc, client: client});
							} else {
								logerr(name, Address, address, err);
								callback(err, null);
							}
						});
					} else {
						logerr(name, Address, address, err);
						callback(err, null);
					}
				});
			} else {
				callback(plerr.ClientNotFound('no Client found with _id {0}'.format(_id)), null);
			}
		});
	},
	find: function(query, callback) {
		_find(Address, query, function(err, docs) {
			if (!err && docs.length > 0) {
				callback(null, docs);
			} else {
				callback('no Address found for query ' + JSON.stringify(query), null);
			}
		});
	},
	remove: function(_id, callback) {
		var name = 'n: {0} | f: {1} '.format(this.__parent_line, this.__parent_function_name);
		_remove(
			Address, 
			_id, 
			function(err, doc){
				if (!err) {
					//now remove the address _id from the client
					_findOne(Client, {_id:doc.clientId}, function(err, doc){
						if(!err && doc) {
							var client = doc;
							client.addresses.splice(client.addresses.indexOf(doc._id),1);
							client.save(function(err){
								if(!err){
									callback(null, client.addresses);
								} else {
									logerr(name, Address, _id, err);
									callback(err, null);
								}
							});
						} else {
							callback(err || 'no Client found with _id {0}'.format(_id), null);
						}
					});
				} else {
					callback(err, null);
				}
			}
		);
	},
	removeAllFromClient: function(_id, callback) {
		_find(Address, {clientId:_id}, function(err, docs) {
			if(!err) {
				var l = docs.length;
				for (var i = l - 1; i >= 0; i--) {
					var address = docs[i];
					address.remove();
				};
				callback(null, 'removed {0} documents from client id: {1}',l,_id);
			} else {
				callback(err, null);
			}
		});
	}
};

// Order
exports.order = {
	statuslist: function(nothing, callback) {
		callback(null, OrderStatusList);
	},
	findOne: function(_id, callback) {
		_findOne(Order, {'_id': _id}, callback);
	},
	find: function(query, callback) { //return all Orders with full Models: Client, Address
		_find(Order, query, function(err, docs) {
			if (!err) {
				var orders = docs;
				var clientIds = [];
				//create array of client _ids
				for (var i = orders.length - 1; i >= 0; i--) {
					var order = orders[i];
					if (clientIds.indexOf(order.clientId) === -1) {
						clientIds.push(order.clientId);	
					};	
				};
				//find Clients
				var query = {
					'_id': {
						$in: clientIds
					}
				}

				_find(Client, query, function(err, docs){
					if (!err) {
						var clients = docs;
						var addressIds = [];
						for (var i = clients.length - 1; i >= 0; i--) {
							var client = clients[i];

							//create array of address _ids
							for (var j = client.addresses.length - 1; j >= 0; j--) {
								var addressId = client.addresses[j];
								if (addressIds.indexOf(addressId) === -1) {
									addressIds.push(addressId);	
								};
							};
						}

						//find Addresses
						var query = {
							'_id': {
								$in: addressIds
							}
						}
						_find(Address, query, function(err, docs) {
							if (!err) {
								var addresses = docs;

								//we have all, now do the mixin
								var clientsDict = {};
								var addressesDict ={};

								//client by _id
								for (var i = clients.length - 1; i >= 0; i--) {
									var client = clients[i];
									clientsDict[client._id] = client;
								};

								//addresses by order
								for (var i = addresses.length - 1; i >= 0; i--) {
									var address = addresses[i];
									addressesDict[address._id] = address;
								};

								//now put everything in Orders
								var superOrders = [];
								for (var i = orders.length - 1; i >= 0; i--) {
									var order = orders[i];
									order = JSON.parse(JSON.stringify(order));
									order['objClient'] = clientsDict[order.clientId];
									order['objAddress'] = addressesDict[order.shippingAddressId];
									superOrders.push(order);
								};

								//finally!
								callback(null, superOrders);

							} else {
								callback(err, null);
							}
						});

					} else {
						callback(err, null);
					}
				});
			} else {
				callback(err, null);
			}
		});
	},
	create: function(payload, callback) {
		//create new order and return its _id
		var order = new Order({
			clientId: payload._id,
			shippingAddressId: payload.order.shippingAddressId,
			photoCount: payload.order.photoCount,
			costPrinting: payload.order.costPrinting,
			costShipping: payload.order.costShipping,
			costTotal: payload.order.costTotal,
			gift: payload.order.gift,
			verbose: payload.order.verbose,
			status: OrderStatus.PaymentPending
		});
		order.save(function(err, neworder) {
			if (!err) {
				callback(null, neworder);
			} else {
				callback(err, null);
			}
		});
	},
	submit: function(order, callback) {
		// find order
		_findOne(Order, {_id: order._id}, function(err, doc) {
			if(!err && doc) {
				//found!
				var neworder = doc;
				// find client
				_findOne(Client, {_id: neworder.clientId}, function(err, doc) {
					if (!err && doc) {
						//found!
						var client = doc;

						//TODO: verify payment???
						neworder.status = OrderStatus.PaymentVerified;
						neworder.payment = {
							verificationCode: 'SUPER_VERIFICATION_CODE',
							error:''
						}

						//update Order
						neworder.photoIds = order.photoIds;

						//saving
						neworder.save(function(err) {
							if(!err) {
								client.orders.push(neworder._id);
								client.save(function(err) {
									if(!err) {
										callback(null, neworder);
									} else {
										console.log('error saving Client');
										callback(err, null);
									}
								})
							} else {
								console.log('error saving Order');
								callback(err, null);
							}
						});
						
					} else {
						callback('no Client found with _id {0}'.format(order.clientId), null);
					}
				});
				
			} else {
				callback('no Order found with _id {0}'.format(order._id), null);
			}
		});
	},
	delete: function(_id, callback) {
		console.log(_id);
		_remove(Order, _id, callback);
	}
}

// HELPERS

var mongoURL = function(obj){ // mongo url conn
    obj.hostname = (obj.hostname || 'localhost');
    obj.port = (obj.port || 27017);
    obj.db = (obj.db || 'test');
    if(obj.username && obj.password){
        return "mongodb://" + obj.username + ":" + obj.password + "@" + obj.hostname + ":" + obj.port + "/" + obj.db;
    }
    else{
        return "mongodb://" + obj.hostname + ":" + obj.port + "/" + obj.db;
    }
}

function logerr(action, model, query, err) {
	if (err) {
		console.log('mongo err: action -> {0} | model -> {1} | params -> {2} | err -> {3}'.format(action, model.modelName,JSON.stringify(query),err));
	} else {
		console.log('mongo err: action -> {0} | model -> {1} | params -> {2}'.format(action, model.modelName,JSON.stringify(query)));
	}
}
