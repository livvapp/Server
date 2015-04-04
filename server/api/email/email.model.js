'use strict';
 var ttl = require('mongoose-ttl');
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var EmailSchema = new Schema({
  email: {type: String, required: true, index: true, unique: true, match: /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/},
  code: {type: String,  required: true, match: /^[0-9]{3}$/},
  verified: {type: Boolean, required: true}
});

 EmailSchema.plugin(ttl, { ttl: '10m' });

module.exports = mongoose.model('Email', EmailSchema);