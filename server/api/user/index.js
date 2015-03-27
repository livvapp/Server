'use strict';

var express = require('express');
var controller = require('./user.controller');
var config = require('../../config/environment');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.get('/', auth.hasRole('admin'), controller.index);
router.delete('/:id', auth.hasRole('admin'), controller.destroy);
router.get('/me', auth.isAuthenticated(), controller.me);
router.get('/me/rank/:tag', auth.isAuthenticated(), controller.tag)
router.post('/me/username', auth.isAuthenticated(), controller.username);
router.put('/:phone/activate', controller.activate);
router.put('/:phone/resend', controller.resend);
router.get('/:id', auth.isAuthenticated(), controller.show);
router.post('/', controller.create);

module.exports = router;
