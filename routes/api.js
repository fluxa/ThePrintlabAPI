/* JSON API
 * ThePrintlab 2013
*/

var conf = require('../conf');
var dbman = require('../dbman');
var help = require('../help');
var mailer = require('../mailer');

//Responses
var reply = {
  sss: function(res, data) {
  	res.json({success:true,data:data});
  },
  err: function(res, err) {
  	res.json({success:false,error:err})
  },
  nop: function(res, params) {
  	res.json({success: false, error:'param {0} not found in request'.format(params)});
  }
}

//performs a simple input-output transaction with managed response
//all transactions in dbman should have the following signature
//t(query, callback)
var dbExec = function(transaction, query, res) {
	transaction(
		query,
		function(err, docs) {
			if(!err) {
				reply.sss(res, docs);
				return;
			}
			reply.err(res, err);
		}
	);
}


// INFO
exports.appinfo = function(req, res) {
	reply.sss(res, conf.info);
}

exports.logs = function(req, res) {
	var data = {};
	help.readFileAtPath('/home/git/apps/api.theprintlab-{0}/shared/log/{1}.out.log'.format(conf.env,conf.env), function(logs) {
		data['stdout'] = logs;

		help.readFileAtPath('/home/git/apps/api.theprintlab-{0}/shared/log/{1}.err.log'.format(conf.env,conf.env), function(logs) {
			data['stderr'] = logs;
			reply.sss(res, data);
		});
	});
}

exports.ping = function(req, res) {
	reply.sss(res, 'OK');
}

// CLIENT
exports.client = {
	//expects -> deviceIdentifier:'device id' | register or get
	register : function(req, res) {
		if (req.body.deviceIdentifier) {
			dbExec(dbman.client.register, req.body.deviceIdentifier, res);
		} else {
			reply.nop(res, 'deviceIdentifier');
		}
	},
	//expects -> _id:'User _id'
	get : function(req, res) {
		if (req.query._id) {
			dbExec(dbman.client.find, {_id:req.query._id}, res);
		} else {
			reply.nop(res, '_id');
		}
	},
	//expects -> query:{'property':'value'}
	find : function(req, res) {
		if(req.query.query) {
			dbExec(dbman.client.find, req.query.query, res);
		} else {
			reply.nop(res, 'query');
		}
	},
	all : function(req, res) {
		dbExec(dbman.client.find, {}, res);
	},
	//expects -> update:{'Client obj'}
	update : function(req, res) {
		if(req.body.update) {
			if (req.body.update._id) {
				dbExec(dbman.client.update, req.body.update, res);
			} else {
				reply.nop(res, 'update._id');
			}
		} else {
			reply.nop(res, 'update');
		}
	},
	//expects -> _id:'client id'
	remove : function(req, res) {
		if (req.body._id) {
			dbExec(dbman.client.remove, req.body._id, res);
		} else {
			reply.nop(res, '_id');
		}
	}
}

// COUPON
exports.coupon = {
	//expects -> { payload:{_id:'Client _id', coupon:'coupon id'} }
	consume : function(req, res) {
		if(req.body.payload && req.body.payload._id && req.body.payload.coupon) {
			//find client
			var _id = req.body.payload._id;
			var coupon = req.body.payload.coupon;
			dbman.client.find({_id:_id}, function(err, docs) {
				if (!err && docs.length > 0) {
					var client = docs[0];
					var consumed = client.coupons.indexOf(coupon);
					if(consumed < 0) {
						client.coupons.push(coupon);
						client.save(function(err){
							if (!err) {
								reply.sss(res, client);
							};
						});
					} else {
						reply.err(res, 'Client _id {0} already consumed coupon {1}'.format(_id, coupon));
					}
				} else {
					reply.err(res, err || 'no Client found with _id {0}'.format(req.body._id));
				}
			});
		} else {
			reply.nop(res, 'payload, payload._id, payload.coupon');
		}
	},
	//Returns a list of coupons available (not consumed) by the Client
	//expects -> {_id:'Client _id'}
	get: function(req, res) {
		if (req.query._id) {
			//find Client
			var _id = req.query._id;
			dbman.client.find({_id:_id}, function(err, docs){
				if(!err && docs.length > 0) {
					var client = docs[0];
					var coupons = [];
					for (var i = conf.coupons.length - 1; i >= 0; i--) {
						var coupon = conf.coupons[i];
						if (client.coupons.indexOf(coupon.code) < 0) {
							coupons.push(coupon);
						};
					};
					reply.sss(res, coupons);
				} else {
					reply.err(res, err || 'no Client found with _id {0}'.format(_id));
				}
			});
		} else {
			reply.nop(res, '_id');
		}
	}
}

// ADDRESS
exports.address = {
	//expects -> payload: {_id:'userid', address:{'Address obj'}}
	register : function(req, res) {
		if (req.body.payload) {
			if(req.body.payload._id && req.body.payload.address) {
				dbExec(dbman.address.register, req.body.payload, res);	
			} else {
				reply.nop(res, 'payload._id & payload.address');
			}
		} else {
			reply.nop(res, 'payload');
		}
	},
	//expects -> {_id:'Address _id'}
	get: function(req, res) {
		if (req.query._id) {
			dbExec(dbman.address.find, {_id: req.query._id}, res);
		} else {
			reply.nop(res, '_id');
		}
	},
	//expects -> {_id:'Address id'}
	remove : function(req, res) {
		if (req.query._id) {
			dbExec(dbman.address.remove, req.query._id, res);
		} else {
			reply.nop(res, '_id');
		}
	}
}


// ORDER
exports.order = {
	statuslist: function(req, res) {
		dbExec(dbman.order.statuslist, '', res);
	},
	//expects -> query:{'property':'value'}
	find : function(req, res) {
		if(req.query.query) {
			dbExec(dbman.order.find, req.query.query, res);
		} else {
			reply.nop(res, 'query');
		}
	},
	findOne : function(req, res) {
		if (req.query._id) {
			dbExec(dbman.order.findOne, req.query._id, res);
		} else {
			reply.nop(res, '_id');
		}
	},
	//expects -> { payload: { _id: Client _id, order: Order} }
	create : function(req, res) {
		if (req.body.payload && req.body.payload._id && req.body.payload.order) {
			dbExec(dbman.order.create, req.body.payload, res);
		} else {
			reply.nop(res, '_id');
		}
	},
	//expects -> order: Order
	submit : function(req, res) {
		if (req.body.order) {
			dbExec(dbman.order.submit, req.body.order, res);	
		} else {
			reply.nop(res, 'order');
		}
	},
	//expects -> {_id: Order _id }
	delete: function(req, res) {
		if (req.query._id) {
			dbExec(dbman.order.delete, req.query._id, res);
		} else {
			reply.nop(res, '_id');
		}
	}
}
