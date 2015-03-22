'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var TokenSchema = new Schema({
  phone: { type: String, required: true },
  passcode: String
});

module.exports = mongoose.model('Token', TokenSchema);