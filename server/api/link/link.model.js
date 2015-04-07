'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var LinkSchema = new Schema({
  alias: String,
  lat: String,
  lon: String
});

module.exports = mongoose.model('Link', LinkSchema);