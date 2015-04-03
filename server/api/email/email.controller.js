'use strict';

var _ = require('lodash');
var Email = require('./email.model');
var nodemailer = require('nodemailer');
//var sesTransport = require('nodemailer-ses-transport');
var mandrill = require('node-mandrill')('KTJENiu1RBdZLqPeenbIoA');

// Get list of emails
// TODO: GET RID OF THIS!!!!!!!!
exports.index = function(req, res) {
  Email.find(function (err, emails) {
    if(err) { return handleError(res, err); }
    return res.json(200, emails);
  });
};

// Creates a new email in the DB.

//TODO: Fix email sending when not added
exports.create = function(req, res) {

  var query = Email.where({email: req.body.email});
  query.findOne(function (err, email) {
    if (err) return handleError(err);
    if (!email) { 
      var code = Math.round(Math.random()*1000);
      while(code < 100) code *= 10;

      var emailobj = req.body;
      emailobj.verified = false;
      emailobj.code = code;

      /*var transport = nodemailer.createTransport(sesTransport({
          accessKeyId: "AKIAIFUCSNSENHLEVQMQ",
          secretAccessKey: "FMeB+6csdIJqqNo81s1DYehjDWpuTkyWCdH0AavW",
          rateLimit: 1 // Unil production ready
      }));*/

      var sub = code.toString() + " - Your Livv Activation Code!";
      var bod = "Please enter this three digit code to confirm your email: " + code.toString();

      /*var mailOptions = {
          from: "noreply@pleebapp.com",
          to: req.body.email,
          subject: sub,
          text: bod
          };

      transport.sendMail(mailOptions, function(err, info) { 
      // TODO: LOGGING
      });*/

      mandrill('/messages/send', {
          message: {
              to: [{email: req.body.email}],
              from_email: 'livy@livv.net',
              from_name: "Titus Patavinus",
              subject: sub,
              text: bod
          }
      }, function(error, response)
      {
          //uh oh, there was an error
          if (error) console.log( JSON.stringify(error) );

          //everything's good, lets see what mandrill said
          else console.log(response);
      });

      Email.create(emailobj, function(err, email) {
        if(err) { return handleError(res, err); }
        return res.send(201);
      });
    } else if (email.verified == true) {
      return res.send(304);
    } else {
      var code = Math.round(Math.random()*1000);
      while(code < 100) code *= 10;

      /*var transport = nodemailer.createTransport(sesTransport({
          accessKeyId: "AKIAIFUCSNSENHLEVQMQ",
          secretAccessKey: "FMeB+6csdIJqqNo81s1DYehjDWpuTkyWCdH0AavW",
          rateLimit: 1 // Unil production ready
      }));*/

      var sub = code.toString() + " - Your Livv Activation Code!";
      var bod = "Please enter this three digit code to confirm your email: " + code.toString();

      /*var mailOptions = {
          from: "noreply@pleebapp.com",
          to: req.body.email,
          subject: sub,
          text: bod
          };

      transport.sendMail(mailOptions, function(err, info) { 
      // TODO: LOGGING
      });*/
      mandrill('/messages/send', {
          message: {
              to: [{email: req.body.email}],
              from_email: 'livy@livv.net',
              from_name: "Titus Patavinus",
              subject: sub,
              text: bod
          }
      }, function(error, response)
      {
          //uh oh, there was an error
          if (error) console.log( JSON.stringify(error) );

          //everything's good, lets see what mandrill said
          else console.log(response);
      });

      var emailobj = email;
      emailobj.verified = false;
      emailobj.code = code;

      emailobj.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.send(200);
      });
    }
  });
};

// Updates an existing email in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  
  var query = Email.where({email: req.params.email});
  query.findOne(function (err, email) {
    if (err) { return handleError(res, err); }
    if (!email) { return res.send(404); }
    if (Number(req.get("code")) == email.code && email.verified == false) {
      var address = email.email;
      var updated = _.merge(email, req.body);
      updated.email = address;
      // updated.resetTTL();//TODO: remove this line
      updated.save(function (err) {
        if (err) { return handleError(res, err); }
        return res.send(200);
      });
    } else return res.send(304);
  });
};

// Deletes a email from the DB.
exports.destroy = function(req, res) {

  var query = Email.where({email: req.params.email});

  query.findOne(function (err, email) {
    if(err) { return handleError(res, err); }
    if(!email) { return res.send(404); }
    //TODO: Take this out
      if(email.verified == false) {
        email.remove(function(err) {
          if(err) { return handleError(res, err); }
          return res.send(204);
        });
      } else {
        return res.send(401);
      }
  });
};

function handleError(res, err) {
  return res.send(500, err);
}