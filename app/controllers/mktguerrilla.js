/*!
 * Module dependencies.
 */

var mongoose = require('mongoose');
var Client = mongoose.model('Client');
var Canned = mongoose.model('Canned');

exports.index = function(req, res) {

  common.async.parallel({
    cans: function(callback) {
      Canned
      .find()
      .sort({
        _id: -1
      })
      .exec(callback)
    }
  },
  // Finally
  function(err, results) {
      res.render('mktguerrilla/index',{
        title: 'Marketing Guerrilla',
        cans: results.cans
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
