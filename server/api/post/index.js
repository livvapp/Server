'use strict';

var express = require('express');
var controller = require('./post.controller');
var auth = require('../../auth/auth.service');
var router = express.Router();

router.get('/', auth.isAuthenticated(), controller.index);
router.get('/tags', auth.isAuthenticated(), controller.tags);
router.post('/', auth.isAuthenticated(), controller.create);

module.exports = router;