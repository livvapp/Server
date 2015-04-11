'use strict';

var _ = require('lodash');
var Token = require('./token.model');
var User = require('../user/user.model');
var plivo = require('plivo');

// Creates a new token in the DB.
exports.create = function(req, res) {

  var query = User.where({phone: req.body.phone})

  query.findOne(function (err, user) {
    if (err) return next(err);
    if (!user) return res.sendStatus(401);

    var tokens = Token.where({phone: req.body.phone});
    tokens.findOne(function(err, tok){
      if(err) return next(err);
      if(!tok) {
        var api = plivo.RestAPI({
          authId: 'MAOGMYMDY2NDU1MDJMYM',
          authToken: 'NTYyOGU0NGYyODVhZDk4NWM2NzM5NjYyMjEyNjg4'
        });

        var code = Math.round(Math.random()*1000000);
        while(code < 100000) code *= 10;
        req.body.passcode = code.toString();

        var codeText = code.toString().substring(0,3) + "-" + code.toString().substring(3) + " - Your Livv Login Code!";

        var params = {
          'src': '13525592572', // Caller Id
          'dst' : user.phone, // User Number to Call
          'text' : codeText,
          'type' : "sms",
        };

        api.send_message(params, function (status, response) {
          //TODO: LOGGING
        });

        Token.create(req.body, function(err, token) {
          if(err) { return handleError(res, err); }
          return res.sendStatus(201);
        });
      } else {
        var api = plivo.RestAPI({
          authId: 'MAOGMYMDY2NDU1MDJMYM',
          authToken: 'NTYyOGU0NGYyODVhZDk4NWM2NzM5NjYyMjEyNjg4'
        });

        var code = Math.round(Math.random()*1000000);
        while(code < 100000) code *= 10;
        tok.passcode = code.toString();

        var codeText = code.toString().substring(0,3) + "-" + code.toString().substring(3) + " - Your Livv Login Code!";

        var params = {
          'src': '13525592572', // Caller Id
          'dst' : user.phone, // User Number to Call
          'text' : codeText,
          'type' : "sms",
        };

        api.send_message(params, function (status, response) {
          //TODO: LOGGING
        });

        tok.save(function(err, token) {
          if(err) { return handleError(res, err); }
          return res.sendStatus(201);
        });
      }
    });
  });
};


function handleError(res, err) {
  return res.sendStatus(500, err);
}