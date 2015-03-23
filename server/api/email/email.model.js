'use strict';
var ttl = require('mongoose-ttl');
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var EmailSchema = new Schema({
  email: {type: String, required: true, index: true, unique: true, match: /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/},
  code: {type: Number, max: 999, min: 100, required: true},
  verified: {type: Boolean, required: true}
});

EmailSchema.plugin(ttl, { ttl: '2m' });

module.exports = mongoose.model('Email', EmailSchema);