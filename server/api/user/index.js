'use strict';

var express = require('express');
var controller = require('./user.controller');
var config = require('../../config/environment');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.get('/me', auth.isAuthenticated(), controller.me);
router.get('/me/feed', auth.isAuthenticated(), controller.feed);
router.get('/me/score', auth.isAuthenticated(), controller.score);
router.post('/me/username', auth.isAuthenticated(), controller.username);
router.put('/:phone/activate', controller.activate);
router.post('/', controller.create);

module.exports = router;
