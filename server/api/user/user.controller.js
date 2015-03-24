'use strict';

var User = require('./user.model');
var Email = require('../email/email.model');
var passport = require('passport');
var config = require('../../config/environment');
var jwt = require('jsonwebtoken');
var plivo = require('plivo');

var validationError = function(res, err) {
  return res.json(422, err);
};

/**
 * Get list of users
 * restriction: 'admin'
 */
exports.index = function(req, res) {
  User.find({}, '-salt -hashedPassword', function (err, users) {
    if(err) return res.send(500, err);
    res.json(200, users);
  });
};

/**
 * Creates a new user
 * TODO: Fix potential bug with database access query.findOne...
 */
exports.create = function (req, res, next) {
  var newUser = new User(req.body);
  newUser.provider = 'local';
  newUser.role = 'user';
  newUser.active = false;

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
      var users = User.where({email: email.email});
      User.findOne(function(err, user){
        if(err) return validationError(res,err);
        if(!user) {
          newUser.save(function(err, user) {
            if (err) return validationError(res, err);
            var token = jwt.sign({_id: user._id }, config.secrets.session, { expiresInMinutes: 60*5 });
            res.json({ token: token });
          });
        } else {
          user.code = newUser.code;
          user.save(function(err, user) {
            if (err) return validationError(res, err);
            var token = jwt.sign({_id: user._id }, config.secrets.session, { expiresInMinutes: 60*5 });
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
 * Get a single user
 */
exports.show = function (req, res, next) {
  var userId = req.params.id;

  User.findById(userId, function (err, user) {
    if (err) return next(err);
    if (!user) return res.send(401);
    res.json(user.profile);
  });
};

/**
 * Deletes a user
 * restriction: 'admin'
 */
exports.destroy = function(req, res) {
  User.findByIdAndRemove(req.params.id, function(err, user) {
    if(err) return res.send(500, err);
    return res.send(204);
  });
};

/**
 * Change a users password
 */
exports.username = function(req, res, next) {
  
  //ar query = User.where({phone: req.params.phone})
  var userId = req.user._id;

  User.findById(userId, function (err, user) {
    if (err) return next(err);
    if (!user) return res.send(401);
    if(!req.body.username) {
      return res.send(403);
    }

    var usernames = User.where({username: req.body.username})
    usernames.findOne(function(err, username){
      if (err) return next(err);
      if (username) return res.send(400);

      user.username = req.body.username;
      user.save(function(err) {
        if (err) return validationError(res, err);
        return res.send(200);
      });
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
    if (!user) return res.send(401);
    if(user.code == Number(req.get('code'))) {
      user.active = true;
      user.code = undefined;
      user.save(function(err) {
        if (err) return validationError(res, err);
        res.send(200);
      });
    } else {
      res.send(403);
    }
  });
};

/**
 * Resend text message
 */
exports.resend = function(req, res, next) {

  var query = User.where({phone: req.params.phone})

  query.findOne(function (err, user) {
    if (err) { return handleError(res, err); }
    if (!user) { return res.send(404); }
    if(user.active == false){
      var updated = user;

      if(req.body.phone)  updated.phone = req.body.phone;
      
      var api = plivo.RestAPI({
        authId: 'MAOGMYMDY2NDU1MDJMYM',
        authToken: 'NTYyOGU0NGYyODVhZDk4NWM2NzM5NjYyMjEyNjg4'
      });

      var code = Math.round(Math.random()*1000);
      while(code < 100) code *= 10;

      var codeText = code.toString() + " - Your Pleeb Activation Code!"

      var params = {
        'src': '13525592572', // Caller Id
        'dst' : updated.phone, // User Number to Call
        'text' : codeText,
        'type' : "sms",
      };

      api.send_message(params, function (status, response) {
        //TODO: LOGGING
      });

      updated.code = code;

      updated.save(function (err) {
        if (err) { return handleError(res, err); }
        return res.send(200);
      });
    } else return res.send(304);
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
    if (!user) return res.send(401);
    res.json({username:user.username});
  });
};

/**
 * Authentication callback
 */
exports.authCallback = function(req, res, next) {
  res.redirect('/');
};
