/*!
 * Module dependencies.
 */

var mongoose = require('mongoose');
var Order = require('../models/order');
var Client = require('../models/client');
var Policy = require('../models/policy');
var Redeem = require('../models/redeem');
var Coupon = require('../models/coupon');
var Email = require('../models/email');

// ### Return all posible status codes nicely formatted for using on the web-admin
// - @preturn {Array} list of all posible OrderStatus
// - @method `GET`
// - @api `private`
exports.status_list = function (req, res) {
	res.send(Order.OrderStatusList);
}

// ### Find Orders by {query:{'prop':'value'}}
// - @param {Object} query in the form {'prop':'value'}
// - @return {Array} array of Order objects
// - @method `POST`
// - @api private
exports.find = function (req, res) {

	var  query = req.body.query;
	if (query) {
		Order.find(query, function(err, docs) {
			if(!err) {
				res.send({orders:docs});
			} else {
				common.plerr.throw(common.plerr.c.DBError, err, res);
			}
		});
	} else {
		common.plerr.throw(common.plerr.c.MissingParameters, 'Missing parameters query', res);
	}
}


// ### Find all Orders return full documents for references with ObjectId
// - @return {Array} array of full Order objects
// - @method `GET`
// - @api `private`
exports.all = function (req, res) {

	Order
	.find()
	.populate('address')
	.populate('client')
	.exec(function(err, docs) {
		if (!err) {
			res.send({orders: docs});
		} else {
			common.plerr.throw(common.plerr.c.DBError, err, res);
		}
	});
}


// ### Manage the Order's payment lifecycle
// - @param {String} Order _id
// - @param {String} action ( start | complete )
// - @return {Object} Order object
// - @method `POST`
// - @api `private`
exports.payment = function (req, res) {

	var _id = req.params['_id'];
	var action = req.params['action'];

	var order = null;
	var time_stamp = common.moment().format('YYYY-MM-DD HH:mm:ss');

	common.async.series([

		// Checks
		function(callback) {

			// check for query args
			if (_id && action) {
				callback();
			} else {
				callback({code:common.plerr.c.MissingParameters , error:'Missing parameters _id, action'});
			}

		},

		// Order
		function(callback) {
			Order
			.findOne({
				_id: _id
			})
			.exec(function(err, doc) {
				if (!err && doc) {
					order = doc;
					callback();
				} else {
					callback({code:common.plerr.c.OrderNotFound , error: common.util.format('Order not found for _id: %s',_id)});
				}
			});
		},

		// Action
		function(callback) {

			var err = null;

			switch(action) {

				case Order.Actions.StartWebpay:
				case 'start':
				{
					// Check if cost_total == 0
					// TODO
					// CHECK IF THIS IS STILL NEEDED SINCE WE ARE CHECKING THIS ON orders/create
					// BUT DEFINITELLY NEEDED FOR BACKWARD COMPATIBILITY
					if (order.cost_total == 0) {
						order.status = Order.OrderStatus.NoNeedPayment;
						order.payment.provider = Order.PaymentProvider.NoPayment;
						order.payment.logs.push(common.util.format('%s|Payment Started => NoPayment', time_stamp));
					} else {
						// Continue with Webpay
						order.status = Order.OrderStatus.PaymentStarted;
						order.payment.provider = Order.PaymentProvider.Webpay;
						order.payment.logs.push(common.util.format('%s|Payment Started => Webpay', time_stamp));
					}
					break;
				}

				// TODO
				// - create payment on stripe
				// - check if saved user or token
				// - create https route (secure.theprintlab.cl)
				// - subscribe to stripe webhooks
				// - create action for no need payment (needs iOS update as well)
				// - double check Webpay still works
				case Order.Actions.StartStripe:
				{
					var stp_token = req.body.stp_token;
					if(stp_token) {
						order.status = Order.OrderStatus.PaymentStarted;
						order.payment.provider = Order.PaymentProvider.Stripe;
						order.payment.data = stp_token;
						order.payment.logs.push(common.util.format('%s|Payment Started => Stripe', time_stamp));
					} else {
						err = {code: common.plerr.c.PaymentError, error:'Stripe Payment Needs stp_token'};
						order.payment.logs.push(common.util.format('%s|Payment Start Stripe Error => %s', time_stamp, err.error));
					}

					break;
				}

				case Order.Actions.Complete:
				{
					// Check if the Order has already been Verified || Submitted
					if (common._.indexOf([Order.OrderStatus.PaymentVerified, Order.OrderStatus.Submitted], order.status) === -1) {

						var payment_data = req.body.payment_data;

						if (payment_data) {

							if(order.payment.provider === Order.PaymentProvider.Webpay) {

								if(typeof(payment_data) != 'string') {
									payment_data = JSON.stringify(payment_data);
								}
								order.payment.data = payment_data;
								order.payment.logs.push(common.util.format('%s|Payment Complete => Webpay', time_stamp));
								order.status = Order.OrderStatus.PaymentVerified;

							} else if(order.payment.provider === Order.PaymentProvider.Stripe) {

								// TODO Verification
								order.status = Order.OrderStatus.PaymentVerified;
								order.payment.logs.push(common.util.format('%s|Payment Complete => Stripe', time_stamp));

							} else if(order.payment.provider === Order.PaymentProvider.NoPayment) {

								order.payment.logs.push(common.util.format('%s|Payment Complete => NoPayment', time_stamp));

							} else {
								err = {
									code: common.plerr.c.MissingParameters,
									error: common.util.format('Cannot complete payment, unknown payment provider or data is empty => %s',payment)
								}
							}
						} else {
							err = {
								code: common.plerr.c.MissingParameters,
								error: 'Cannot complete payment, missing payment data'
							}
						}

					} else {
						// TODO
						// THIS SHOULD NEVER HAPPEN, SOMETHING WENT VERY WRONG
						err = {
							code: common.plerr.c.CannotVerifyPayment,
							error: 'Order is already Verified / Submitted, cannot pay twice'
						}
					}

					break;
				}

				case Order.Actions.Fail:
				{
					order.status = Order.OrderStatus.PaymentError;
					var payment_log = req.body.payment_log || 'unknown reason';
					if (payment_log) {
						order.payment.logs.push(common.util.format('%s|Payment Failed => reason: %s',time_stamp,payment_log));
					};
					break;
				}

				default:
				{
					err = {
						code: common.plerr.c.MissingParameters,
						error: 'Wrong action'
					}
					break;
				}
			}

			callback(err);

		},

		// Save
		function(callback) {
			order.markModified('payment');
			order.save(function(err, saved) {
				if (!err && saved) {
					order = saved;
					callback();
				} else {
					if(err) {
						console.log('orders.payment.complete | error => %s',common.util.inspect(err));
					}
					callback({code:common.plerr.c.DBError , error: common.util.format('/order/payment/ -> Cannot save Order _id: %s',_id)});
				}
			});
		}

	],
	// Finally
	function(err) {
		if(!err) {
			res.send({
				order: order
			});
		} else {
			common.plerr.throw(err.code, err.error, res);
		}
	});


}

// ### Get one Order by _id
// - @return {Object} Order object
// - @method `GET`
// - @api `public`
exports.get = function (req, res) {
	var _id = req.params['_id'];

	if (_id) {
		Order.findOne({_id: _id}).populate('client').populate('address').exec(function(err, doc) {
			if (!err && doc) {
				res.send({order: doc});
			} else {
				common.plerr.throw(common.plerr.c.OrderNotFound, err || common.util.format('Order not found for _id: %s',_id), res);
			}
		});
	} else {
		common.plerr.throw(common.plerr.c.MissingParameters, 'Missing parameters _id', res);
	}

}

/**
 * Create a new Order for a Client and returns a partial Order object
 *
 * @param {Object} payload in the form { order: { client: 'ObjectId', ... (order fields) }, replace_order_id:'' }
 * @return {Object} order partial Order object
 * @api public
 */
exports.create = function (req, res) {

	var order;
	var client;
	var old_order;
	var policy;
	var new_order;

	common.async.series([

		// Validations
		function(callback) {
			order = req.body.order;
			if (order && order.client) {
				callback()
			} else {
				callback({
					code: common.plerr.c.MissingParameters,
					verbose: 'Missing parameters order'
				});
			}
		},

		// Check if we are submitting an Order with an existing order id
		function(callback) {
			if (req.body.replace_order_id) {
				Order
				.findOne({
					_id: req.body.replace_order_id
				})
				.exec(function(err, doc) {
					if (!err && doc) {
						old_order = doc;
						// Move payment.logs to the new Order
						if (old_order.payment && old_order.payment.logs) {
							order['payment'] = old_order.payment;
						};
					}
					callback();
				});
			} else {
				callback();
			}
		},

		// Get Client
		function(callback) {
			Client
			.findOne({
				_id: order.client
			})
			.exec(function(err, doc) {
				if (!err && doc) {
					client = doc;
					callback();
				} else {
					callback({
						code: common.plerr.c.ClientNotFound,
						verbose: err || 'Client not found'
					}, null);
				}
			});
		},

		// Get policy if coupon
		function(callback) {
			if(order.coupon_code) {
				if(order.coupon_code.length === 24){ // ObjectId
					Policy
					.findOne({
						_id: order.coupon_code
					})
					.populate('coupon')
					.exec(function(err, doc) {
						if(!err && doc) {
							policy = doc;
							callback();
						} else {
							console.log('Couldn\'t find Policy with id %s',order.coupon_code);
							callback({
								code: common.plerr.c.CouponInvalid,
								verbose: 'Coupon is not valid'
							});
						}
					})
				} else {
					Redeem
					.findOne({
						code: order.coupon_code
					})
					.populate('policy')
					.exec(function(err, doc) {
						if(!err && doc) {
							Policy
							.populate(doc, {
								path: 'policy.coupon',
								model: Coupon
							},
							function(err, redeem) {
								if(!err && redeem) {
									policy = redeem.policy;
									callback();
								} else {
									console.log('Couldn\'t find Redeem with id %s',order.coupon_code);
									callback({
										code: common.plerr.c.CouponInvalid,
										verbose: 'Coupon is not valid'
									});
								}
							});
						}
					});
				}

			} else {
				callback();
			}
		},

		// Validate Coupon if exists
		function(callback) {

			if (policy) {

				// Check if coupon is not consumed
				// or reuse coupon from old_order
				var ccode = policy._id.toString();
				if(client.consumed_coupons.indexOf(ccode) === -1 || (old_order && old_order.coupon_code === ccode)) {
					// Validate!
					if(policy.coupon.isValid(order.photo_count, order.cost_total)) {
						console.log('coupon is valid!');
						client.consumed_coupons.push(order.coupon_code);

						// Set NoNeedPayment status if needed
						if(order.cost_total === 0) {
							order.status = Order.OrderStatus.NoNeedPayment;
							order.payment = {
								provider: Order.PaymentProvider.NoPayment,
								data: '',
								logs: []
							}
						}

						callback();
					} else {
						callback({
							code:  common.plerr.c.CouponInvalid,
							verbose: 'Coupon is not valid'
						});
					}
				} else {
					callback({
						code: common.plerr.c.CouponConsumed,
						verbose: 'Coupon is already consumed'
					});
				}
			} else {
				callback();
			}
		},

		// Create Order
		function(callback) {
			Order
			.create(order, function(err, doc) {
				if (!err && doc) {
					new_order = doc;
					callback();
				} else {
					callback({
						code: common.plerr.c.DBError,
						verbose: err || 'Cannot create Order'
					});
				}
			});
		},

		// Update Client
		function(callback) {
			// Remove OldOrder Id if neccesary
			// We are also doing this on pre Order remove hook
			// But we need to return to the Client the right model
			if(old_order) {
				client.orders.splice(client.orders.indexOf(old_order._id),1);
			}

			// Save Client
			client.save(function(err, saved) {
				if (!err && saved) {
					client = saved;
					callback();
				} else {
					callback({
						code: common.plerr.c.DBError,
						verbose: err || 'Cannot saved client'
					});
				}
			});
		}
	],
	// Finally. Create new Order
	function(err) {
		if (!err) {

			res.send({
				order: new_order,
				client: client
			});

			// Remove old_order if necessary
			if (old_order) {
				old_order.remove();
			}

		} else {
			// throw series err
			common.plerr.throw(err.code, err.verbose, res);
		}
	});

}


// ### Submits the Order and saves required information
// - @param {Object} `{ order: {_id:'xx', photos:[]} }`
// - @return {Object} `order` full Order object
// - @method `PUT`

exports.submit = function (req, res) {

	var order;
	var client;
	var offline_payment = (req.body.offline_payment === true);

	common.async.series([
		function(callback) {
			var o = req.body.order;
			if (o && o._id && o.photos) {
				Order
				.findOne({
					_id: o._id
				})
				.populate('address')
				.exec(function(err, doc) {
					if(!err && doc) {
						order = doc;
						order.photos = o.photos;
						callback();
					} else {
						callback({
							code: common.plerr.c.OrderNotFound,
							verbose: 'Order not found'
						});
					}
				})
			} else {
				callback({
					code: common.plerr.c.MissingParameters,
					verbose: 'Missing parameters order'
				});
			}
		},
		function(callback) {
			Client
			.findOne({
				_id: order.client
			})
			.exec(function(err, doc) {
				if(!err && doc) {
					client = doc;
					callback();
				} else {
					callback({
						code: common.plerr.c.ClientNotFound,
						verbose: 'Client not found'
					});
				}
			})
		}
	],
	// Finally
	function(err, results) {
		if(err) {
			common.plerr.throw(err.code, err.verbose, res);
		} else {
			// Verifying payment
			// Status should be PaymentVerified || NoNeedPayment || PaymentOffline
			// This is status is set internally when the payment
			// has been successfully completed
			// and any other status should reject the order
			if( order.status === Order.OrderStatus.PaymentVerified ||
				order.status === Order.OrderStatus.NoNeedPayment   ||
				offline_payment ) {

				// We dont set status submitted for PaymentOffline yet
				if(offline_payment) {
					order.status = Order.OrderStatus.PaymentOffline;
					order.payment.provider = Order.PaymentProvider.BankTransfer;
				} else  {
					order.status = Order.OrderStatus.Submitted;
				}

				// saving
				order.save(function(err, saved) {
					if(!err) {
						if (client.orders.indexOf(saved._id) === -1) {
							client.orders.push(saved._id);
						};
						client.save(function(err) {
							if(!err) {
								res.send({
									order: saved
								});

								// Queue confirmation email
								var today = common.moment();
								var template_locals = {
									order_id: order._id,
									photos_qty: order.photo_count,
									cost_printing: order.cost_printing,
									cost_shipping: order.cost_shipping,
									cost_total: order.cost_total,
									address_to_name: common.util.format('%s %s', order.address.name, order.address.last_name),
									address: common.util.format('%s %s %s %s %s', order.address.address_line1, order.address.address_line2, order.address.comuna, order.address.provincia, order.address.region),
									current_year: today.format('YYYY')
								}
								var template_name;
								var to_emails = [client.email];
								var bcc = common.config.admin_emails;
								var subject = '';
								var type;


								// Status specific config
								switch(order.status) {
								case Order.OrderStatus.Submitted:
									template_name = 'order_confirm';
									subject = common.util.format('ThePrintlab: Confirmación de Pedido (%s)', order._id);
									type = Email.Types.OrderConfirmation;
									break;
								case Order.OrderStatus.PaymentOffline:
									template_locals.confirm_payment_url = common.util.format('http://www.theprintlab.cl/bktrans?order_id=%s&env=%s',order._id,common.env)
									template_name = 'order_bank_transfer';
									subject = common.util.format('ThePrintlab: Pedido Recibido (%s)', order._id);
									type = Email.Types.OrderConfirmationOffline;
									break;
								}

								common.mailqueue.add(
									template_name,
									template_locals,
									null,
									to_emails,
									bcc,
									subject,
									type,
									function(err, result) {
										console.log('Order Submit emailqueue.add => %s',err || 'SENT');
									}
								);

							} else {
								common.plerr.throw(common.plerr.c.DBError, err, res);
							}
						})
					} else {
						common.plerr.throw(common.plerr.c.DBError, err, res);
					}
				});
			} else {
				common.plerr.throw(common.plerr.c.CannotVerifyPayment, common.util.format('The Order _id %s has status %s and the payment cannot be verified.',order._id, order.status), res);
			}
		}
	})

}

/**
 * Remove Order from database
 *
 * @param {String} _id of the Order to remove
 * @return {String} 200 OK | 400 Error
 * @api private
 */
exports.remove = function (req, res) {

	var _id = req.params['_id'];
	if (_id) {
		Order.findOne({_id: _id}, function(err, doc) {
			if (!err && doc) {
				doc.remove();
				res.send({order: doc});
			} else {
				common.plerr.throw(common.plerr.c.ClientNotFound, err || common.util.format('Order remove -> not found for _id: %s',_id), res);
			}
		});
	} else {
		common.plerr.throw(common.plerr.c.MissingParameters, 'Missing parameters _id', res);
	}
}

/**
 * Marks an Order as Canceled by User
 *
 * @param {String} _id of the Order
 * @return {String} 200 OK | 400 Error
 * @api public
 */
 exports.cancel = function(req, res) {
 	var _id = req.params['_id'];
 	if (_id) {
 		Order
 		.findOne({
 			_id: _id
 		})
 		.populate('client')
 		.exec(function(err, doc) {
 			if(!err && doc) {

 				doc.status = Order.OrderStatus.CanceledByUser;
 				doc.save();

 				// If order used coupon, remove it from consumed
 				if(doc.coupon_code && doc.client) {
 					var client = doc.client;
 					if(client.consumed_coupons) {
 						client.consumed_coupons = common._.without(client.consumed_coupons,doc.coupon_code);
 						client.save();
 					}
 				}

 				res.send({order: doc});
 			} else {
 				common.plerr.throw(common.plerr.c.OrderNotFound, err || common.util.format('Order cancel -> not found for _id: %s',_id), res);
 			}
 		});
 	} else {
		common.plerr.throw(common.plerr.c.MissingParameters, 'Missing parameters _id', res);
	}
 }

 /**
  * Order Offline Payment Confirmation
  *
  * @param {String} _id of the Order
  * @return {String} 200 OK | 400 Error
  * @api public
  */
  exports.payment_offline_confirmation = function(req, res) {

    var data;
    var order;
    var order_id;

    common.async.series([
      // Parsing Bank Transfer Data
      function(callback) {
        var bank = req.body.bank;
        var name = req.body.name;
        var date = common.moment(req.body.date);
        order_id = req.body.order_id;

        if(bank && name && date.isValid() && order_id) {
          data = {
            bank: bank,
            name: name,
            date: date.format('YYYY-MM-DD')
          }
          callback();
        } else {
          callback('Missing parameters');
        }
      },
      // Get Order
      function(callback) {
        Order
        .findOne({
          _id: order_id
        })
        .populate('client')
        .exec(function(err, doc) {
          if(!err && doc) {
            order = doc;
            callback();
          } else {
            callback(err || 'Order not found');
          }
        });
      },
      // Saved data
      function(callback) {
        order.payment.data = common.util.format('Bank:%s;Name:%s;Date:%s',data.bank,data.name,data.date);
        order.save(callback);
      },
      // Notify TPL
      function(callback) {

        var template_locals = {
          order_id: order._id,
          cost_total: order.cost_total,
          order_verbose: order.verbose,
          bank: data.bank,
          name: data.name,
          date: data.date,
          current_year: common.moment().format('YYYY')
        }
        var subject = common.util.format('ThePrintlab: Bank Transfer Confirmation (%s)',order._id);
        var to_emails;
				var bcc;
        if(order.client.email) {
          to_emails = [order.client.email];
					bcc = common.config.admin_emails;
        } else {
          to_emails = common.config.admin_emails;
					bcc = [];
        }
        common.mailqueue.add(
          'payment_offline_confirm',
          template_locals,
					null,
          to_emails,
					bcc,
          subject,
          Email.Types.PaymentOfflineNotify,
          callback
        );
      }
    ],
    // Finally
    function(err, results) {
      if(!err) {
        res.send({success:true});
      } else {
        res.send({success:false, err:err});
      }
    });


  }
