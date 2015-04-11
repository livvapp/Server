'use strict';

var User = require('./user.model');
var Email = require('../email/email.model');
var passport = require('passport');
var config = require('../../config/environment');
var jwt = require('jsonwebtoken');
var _ = require('lodash');
//var Tag = require('../tag/tag.model');

var validationError = function(res, err) {
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
      if(err) { return handleError(res, err); }
      if(!email) { return validationError(res,{error:"Email has not been verified."}); }
      if(email.verified == false) {
        return validationError(res,{error:"Email has not been verified."});
      }
      
      var api = plivo.RestAPI({
        authId: 'MAOGMYMDY2NDU1MDJMYM',
        authToken: 'NTYyOGU0NGYyODVhZDk4NWM2NzM5NjYyMjEyNjg4'
      });

      var code = Math.round(Math.random()*1000);
      while(code < 100) code *= 10;
      newUser.code = code;

      var codeText = code.toString() + " - Your Livv Activation Code!"

      var params = {
        'src': '13525592572', // Caller Id
        'dst' : newUser.phone, // User Number to Call
        'text' : codeText,
        'type' : "sms",
      };

      api.send_message(params, function (status, response) {
        //TODO: LOGGING
      });


      //console.log("wtf");
      //console.log(email.email);
      var users = User.where({email: email.email});
      users.findOne(function(err, user){
        if(err) return validationError(res,err);
        if(!user) {
          User.create(newUser, function(err, user) {
            if (err) return validationError(res, err);
            var token = jwt.sign({_id: user._id }, config.secrets.session);
            res.json({ token: token });
          });
        } else {
          //console.log(user.email);
          user.code = newUser.code;
          user.save(function(err, user) {
            if (err) return validationError(res, err);
            var token = jwt.sign({_id: user._id }, config.secrets.session);
            res.json({ token: token });
          });
        }
      });
    });
  } else {
    next = false;
    return validationError(res,{error:"Email required at this time."});
  }

};

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
      if (err) return validationError(res, err);
      return res.sendStatus(200);
    });
  });

};

exports.friends = function(req, res, next) {
  
  // Make sure each is string
  var user = req.user;
  if(!(req.body instanceof Array))  return res.sendStatus(403);
  user.friends = _.uniq(req.body);
  user.save(function(err){
    if (err) return validationError(res, err);
    return res.sendStatus(200);
  });

};

/**
 * Activate an account by confirming the phone number
 */
exports.activate = function(req, res, next) {

  var query = User.where({phone: req.query.phone})

  query.findOne(function (err, user) {
    if (err) return next(err);
    if (!user) return res.sendStatus(401);
    if(user.code == Number(req.get('code'))) {
      user.active = true;
      user.code = undefined;
      user.save(function(err) {
        if (err) return validationError(res, err);
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
    res.json({score:user.score});
  });
};

/**
 * Authentication callback
 */
exports.authCallback = function(req, res, next) {
  res.redirect('/');
};
