'use strict';

var ttl = require('mongoose-ttl');
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var TokenSchema = new Schema({
  phone: { type: String, required: true },
  passcode: String
});

TokenSchema.plugin(ttl, { ttl: '7m' });

module.exports = mongoose.model('Token', TokenSchema);