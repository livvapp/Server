'use strict';

var express = require('express');
var passport = require('passport');
var auth = require('../auth.service');
var Token = require('../../api/token/token.model');

var router = express.Router();

router.post('/', function(req, res, next) {

	if (req.body.phone) {
		var query = Token.where({phone: req.body.phone});
		if(req.body.password) {
			query.findOne(function (err, tok) {
				if(!tok) { return res.sendStatus(401); }
				if(tok.passcode != req.body.password) {
					//console.log("tok.passcode = " + tok.passcode + ", req.body.password = " + req.body.password);
					return res.sendStatus(401);
				}
				tok.remove(function(err) {
      				if(err) { return handleError(res, err); }
    			});
				passport.authenticate('local', function (err, user, info) {
				    var error = err || info;
				    if (error) return res.status(401).json(error);
				    if (!user) return res.status(404).json({message: 'Something went wrong, please try again.'});

				    var token = auth.signToken(user._id, user.role);
				    res.json({token: token});
				})(req, res, next)
			});
		} else {
			return res.sendStatus(400);
		}
	} else {
		return res.sendStatus(400);
	}
});

module.exports = router;