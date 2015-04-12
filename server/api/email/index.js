'use strict';

var express = require('express');
var controller = require('./email.controller');

var router = express.Router();

//router.get('/', controller.index);
router.post('/', controller.create);
router.put('/:email', controller.update);
router.patch('/:email', controller.update);

module.exports = router;