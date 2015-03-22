'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var PostSchema = new Schema({
  loc: Schema.Types.Mixed,
  tags: [String]
});

PostSchema.index({loc:'2dsphere'});

module.exports = mongoose.model('Post', PostSchema);