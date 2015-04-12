'use strict';

var User = require('./user.model');
var Email = require('../email/email.model');
var passport = require('passport');
var config = require('../../config/environment');
var jwt = require('jsonwebtoken');
var _ = require('lodash');
//var Tag = require('../tag/tag.model');

var validationError = function(req, res, err) {
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

  return res.status(422).json(err);
};

/**
 * Creates a new user
 * TODO: Fix potential bug with database access query.findOne...
 */
exports.create = function (req, res, next) {
  var plivo = require('plivo');
  var newUser = new User(req.body);
  newUser.provider = 'local';
  newUser.role = 'user';
  newUser.active = false;
  newUser.score = 19;

  if(req.body.hasOwnProperty("email")) {
    var query = Email.where({email: req.body.email});
    query.findOne(function (err, email) {
      if(err) { return validationError(req, res, err); }
      if(!email) { return validationError(req, res,{error:"Email has not been verified."}); }
      if(email.verified == false) {
        return validationError(req, res,{error:"Email has not been verified."});
      }
      var users = User.where({email: email.email});
      users.findOne(function(err, user){
        var pusers = User.where({phone: newUser.phone});
        pusers.findOne(function(err, puser){
          if(err) return validationError(req,res,err);
          if(!(puser && puser.active)) {
            var api = plivo.RestAPI({
              authId: 'MAOGMYMDY2NDU1MDJMYM',
              authToken: 'NTYyOGU0NGYyODVhZDk4NWM2NzM5NjYyMjEyNjg4'
            });

            var code = Math.round(Math.random()*10).toString()[0] + Math.round(Math.random()*10).toString()[0] + Math.round(Math.random()*10).toString()[0];
            newUser.code = code;

            var codeText = code + " - Your Livv Activation Code!"

            var params = {
              'src': '13525592572', // Caller Id
              'dst' : newUser.phone, // User Number to Call
              'text' : codeText,
              'type' : "sms",
            };

            api.send_message(params, function (status, response) {
              //TODO: LOGGING
            });
            if(!user) {
              User.create(newUser, function(err, user) {
                if (err) return validationError(req, res, err);
                var token = jwt.sign({_id: user._id }, config.secrets.session);
                res.json({ token: token });
              });
            } else {
              //console.log(user.email);
              user.code = newUser.code;
              user.save(function(err, user) {
                if (err) return validationError(req, res, err);
                var token = jwt.sign({_id: user._id }, config.secrets.session);
                res.json({ token: token });
              });
            }
          } else {
            return validationError(req, res,{error:"Phone already exists."});
          }
        });
      });
    });
  };
}/* else {
    next = false;
    return validationError(res,{error:"Email required at this time."});
  }

}*/;

/**
 * Set Username
 */
exports.username = function(req, res, next) {
  
  //ar query = User.where({phone: req.params.phone})
  var userId = req.user._id;
  if(req.body.username) {
    if(typeof req.body.username == "string") {
      if(req.body.username.indexOf(".") != -1) {
        var parts = req.body.username.split(".")
        req.body.username = "";
        parts.forEach(function(element, index, array){
          req.body.username += element;
        });
      } 
      if(req.body.username.indexOf("$") != -1) {
        var parts = req.body.username.split("$")
        req.body.username = "";
        parts.forEach(function(element, index, array){
          req.body.username += element;
        });
      } 
      if(req.body.username.length == 0)
        return res.sendStatus(403);
    }
  }

  User.findById(userId, function (err, user) {
    if (err) return next(err);
    if (!user) return res.sendStatus(401);
    if(!req.body.username) {
      return res.sendStatus(403);
    }
    user.username = req.body.username;
    user.save(function(err) {
      if (err) return validationError(req, res, err);
      return res.sendStatus(200);
    });
  });

};

/**
 * Activate an account by confirming the phone number
 */
exports.activate = function(req, res, next) {

  var query = User.where({phone: req.params.phone})

  query.findOne(function (err, user) {
    if (err) return next(err);
    if (!user) return res.sendStatus(401);
    if(user.code == req.get('code')) {
      user.active = true;
      user.code = undefined;
      user.save(function(err) {
        if (err) return validationError(req, res, err);
        res.sendStatus(200);
      });
    } else {
      res.sendStatus(403);
    }
  });
};

/**
 * Get my info
 */
exports.me = function(req, res, next) {
  var userId = req.user._id;
  User.findOne({
    _id: userId
  }, '-salt -hashedPassword', function(err, user) { // don't ever give out the password or salt
    if (err) return next(err);
    if (!user) return res.sendStatus(401);
    res.json({username:user.username});
  });
};

exports.feed = function(req, res, next) {
  var userId = req.user._id;
  User.findOne({
    _id: userId
  }, '-salt -hashedPassword', function(err, user) { // don't ever give out the password or salt
    if (err) return next(err);
    if (!user) return res.sendStatus(401);
    res.json({feed:user.feed});
  });
};

exports.score = function(req, res, next) {
  var userId = req.user._id;
  User.findOne({
    _id: userId
  }, '-salt -hashedPassword', function(err, user) { // don't ever give out the password or salt
    if (err) return next(err);
    if (!user) return res.sendStatus(401);
    res.json({score:Math.round(user.score)});
  });
};

/**
 * Authentication callback
 */
exports.authCallback = function(req, res, next) {
  res.redirect('/');
};
