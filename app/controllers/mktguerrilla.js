/*!
 * Module dependencies.
 */

var mongoose = require('mongoose');
var Client = mongoose.model('Client');
var Canned = mongoose.model('Canned');
var Email = mongoose.model('Email');
var Push = mongoose.model('Push');

exports.index = function(req, res) {

  common.async.parallel({
    cans: function(callback) {
      Canned
      .find()
      .sort({
        _id: -1
      })
      .exec(callback)
    },
    clients: function(callback) {
      Client
      .find()
      .or([
        {
          email: {
            $exists: true
          }
        },
        {
          pushtoken: {
            $exists: true
          }
        }
      ])
      .exec(callback)
    }
  },
  // Finally
  function(err, results) {
      res.render('mktguerrilla/index',{
        title: 'Marketing Guerrilla',
        cans: results.cans,
        clients: results.clients
      });

  });


}

exports.cans_add = function(req, res) {

  var canned;

  common.async.series([
    function(callback) {
      var subject = req.body.subject;
      var body = req.body.body;
      var short = req.body.short;
      if(subject && body || short) {
        canned = new Canned({
          subject: subject || '',
          body: body || '',
          short: short || ''
        });
        callback();
      } else {
        callback('Missing parameters');
      }
    },
    function(callback) {
      canned.save(callback);
    }
  ],
  // Finally
  function(err) {
    if(!err) {
      req.flash('success', 'Canned message added successfully!');
    } else {
      req.flash('error', err);
    }
    res.redirect('/admin/mktguerrilla');
  })
}

exports.canned_remove = function(req, res) {
  common.async.waterfall([
    function(callback) {
      var canned_id = req.params._id;
      if(canned_id) {
        Canned
        .findOne({
          _id: canned_id
        })
        .exec(callback)
      } else {
        callback('Missing parameters');
      }
    },
    function(canned, callback) {
      canned.remove(callback);
    }
  ],
  // Finally
  function(err) {
    if(!err) {
      req.flash('success', 'Removed Canned');
    } else {
      req.flash('error', err);
    }
    res.redirect('/admin/mktguerrilla');
  })

}

exports.attack = function(req, res) {

  var targeted_clients;
  var clients_dict = {};
  var subject = req.body.subject || '';
  var body = req.body.body || '';
  var short = req.body.short || '';
  var push;
  var logs = [];


  common.async.series([
    function(callback) {
      targeted_clients = req.body.targeted_clients;
      if(targeted_clients) {
        callback();
      } else {
        callback('Missing parameters');
      }
    },

    // Get Clients
    function(callback) {
      var all = common._.union(targeted_clients.pushes || [], targeted_clients.emails || []);
      console.log(all)
      Client
      .find({
        _id:{
          $in: all
        }
      })
      .exec(function(err, docs) {
        if(!err && docs) {
          clients_dict = common._.indexBy(docs, '_id');
          callback();
        } else {
          callback(err || 'Unknown error');
        }
      })
    },

    // Deal with Pushes
    function(callback) {

      var ios_tokens = [];
      common._.each(targeted_clients.pushes, function(_id) {
        var client = clients_dict[_id];
        var pushtoken = client.pushtoken;
        if(pushtoken) {
          if(pushtoken.token && pushtoken.platform === 'ios') {
            ios_tokens.push(pushtoken.token);
          }
        }
      });
      if(ios_tokens.length > 0 && short) {
          var p = new Push({
            ios_tokens: ios_tokens,
            message: short,
            sent: false
          });
          p.save(function(err, saved){
            if(!err) {
              push = saved;
              logs.push(common.util.format('Push notification to %d devices will be delivered shortly.',push.ios_tokens.length));
            } else {
              logs.push('Something went wrong with the pushes => ' + JSON.stringify(err));
            }
            callback();
          });
      } else {
        callback();
      }

    },

    // Deal with Emails
    function(callback) {
      var emails = [];
      common._.each(targeted_clients.emails, function(_id) {
        var client = clients_dict[_id];
        if(client.email) {
          emails.push(client.email);
        }
      });
      if(emails.length > 0 && subject && body) {
        var locals = {
          subject: subject,
          body: body,
          current_year: common.moment().format('YYYY'),
          header_n: (Math.floor(Math.random() * 2) + 3).toString()
        }
        common.mailqueue.add(
          'mkt_guerrilla',
          locals,
          'hola@theprintlab.cl',
          emails,
          null,
          subject,
          Email.Types.MktGuerrilla,
          function(err, response) {
            if(!err) {
              logs.push(common.util.format('%d Emails were queued successfully!!',emails.length));
            }
            callback(err);
          }
        );
      } else {
        callback();
      }
    }
  ],
  // Finally
  function(err) {
    var log = logs.join(' | ');
    console.log(log);
    var success = false;
    if(err) {
      req.flash('error', err || log);
    } else {
      success = true;
      req.flash('success', log);
    }
    res.send({success: success, log: log, err: err});
  });
}

exports.emails = function(req, res) {
  var limit = req.params.limit || 50;
  common.async.series({
    emails: function(callback) {
      Email
      .find()
      .select('sent sent_utc subject to created_utc type retries logs')
      .sort({
        _id: -1
      })
      .limit(limit)
      .exec(callback);
    }
  },
  // Finally
  function(err, results) {
    res.render('mktguerrilla/emails', {
      title: 'Emails',
      limit: limit,
      emails: results.emails
    });
  });
}
