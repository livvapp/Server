'use strict';

var _ = require('lodash');
var Email = require('./email.model');
var nodemailer = require('nodemailer');
//var sesTransport = require('nodemailer-ses-transport');
var mandrill = require('node-mandrill')('KTJENiu1RBdZLqPeenbIoA');

// Creates a new email in the DB.

//TODO: Fix email sending when not added
exports.create = function(req, res) {


  console.log(req.body);
  var query = Email.where({email: req.body.email});
  query.findOne(function (err, email) {
    if (err) return handleError(req, res, err);

    var code = Math.round(Math.random()*10).toString() + Math.round(Math.random()*10).toString() + Math.round(Math.random()*10).toString();

    var sub = code + " - Your Livv Activation Code!";
    var bod = "Please enter this three digit code to confirm your email: " + code;

    mandrill('/messages/send', {
        message: {
            to: [{email: req.body.email}],
            from_email: 'livy@livv.net',
            from_name: "Titus Patavinus",
            subject: sub,
            text: bod
        }
    }, function(error, response) { });


    if (!email) {

      var emailobj = req.body;
      emailobj.verified = false;
      emailobj.code = code;

      Email.create(emailobj, function(err, email) {
        if(err) { return handleError(req, res, err); }
        return res.sendStatus(201);
      });
    } else if (email.verified == true) {
      return res.sendStatus(304);
    } else {

      var emailobj = email;
      emailobj.verified = false;
      emailobj.code = code;

      emailobj.save(function (err) {
        if (err) { return handleError(req, res, err); }
        return res.sendStatus(200);
      });
    }
  });
};

// Updates an existing email in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  
  var query = Email.where({email: req.query.email});
  query.findOne(function (err, email) {
    if (err) { return handleError(req, res, err); }
    if (!email) { return res.sendStatus(404); }
    if (req.get("code") == email.code && email.verified == false) {
      var address = email.email;
      var updated = _.merge(email, req.body);
      updated.email = address;
      // updated.resetTTL();//TODO: remove this line
      updated.save(function (err) {
        if (err) { return handleError(req, res, err); }
        return res.sendStatus(200);
      });
    } else return res.sendStatus(304);
  });
};

// Deletes a email from the DB.
exports.destroy = function(req, res) {

  var query = Email.where({email: req.query.email});

  query.findOne(function (err, email) {
    if(err) { return handleError(req, res, err); }
    if(!email) { return res.sendStatus(404); }
    //TODO: Take this out
      if(email.verified == false) {
        email.remove(function(err) {
          if(err) { return handleError(req, res, err); }
          return res.sendStatus(204);
        });
      } else {
        return res.sendStatus(401);
      }
  });
};

function handleError(req, res, err) {
  var loggly = require('loggly');
 
  var logger = loggly.createClient({
    token: "3b05e407-4548-47ca-bc35-69696794ea62",
    subdomain: "livv",
    tags: ["NodeJS"],
    json:true
  });

  var error = {err: err}
  if(req.user)  error.user = req.user.phone
  logger.log(error);

  return res.status(500).json(err);
}