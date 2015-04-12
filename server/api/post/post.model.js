'use strict';

var ttl = require('mongoose-ttl');
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var PostSchema = new Schema({
  loc: Schema.Types.Mixed,
  tags: Schema.Types.Mixed,
  address: String,
  toptag: String,
  topweight: Number,
  weight: Number,
  invitees: [String],
  score: Number, //just for returning
  shares: Schema.Types.Mixed,
  tagtouser: Schema.Types.Mixed,
  userpoints: Schema.Types.Mixed,
  usertotag: Schema.Types.Mixed
});

PostSchema.index({loc:'2dsphere'});
PostSchema.plugin(ttl, { ttl: '2h' });

module.exports = mongoose.model('Post', PostSchema);