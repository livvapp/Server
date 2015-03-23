'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var PostSchema = new Schema({
  loc: Schema.Types.Mixed,
  tags: Schema.Types.Mixed,
  address: String,
  weight: Number
});

PostSchema.index({loc:'2dsphere'});

module.exports = mongoose.model('Post', PostSchema);