const { Schema, model } = require('mongoose');
const bcrypt = require('bcrypt');
const Event = require('./Event');
const commentSchema = require('./Comment');

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      match: [/.+@.+\..+/, 'Must use a valid email address'],
    },
    password: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
    },
    bio: {
      type: String,
    },
    favoriteCuisine: {
      type: String,
    },
    myCurrentEvent: [ String ],
    myJoinedEvent: [ String ],
    comment: [ commentSchema ]
  },
  // set this to use virtual below
  {
    toJSON: {
      virtuals: true,
    },
  }
);
// hash user password
userSchema.pre('save', async function (next) {
  if (this.isNew || this.isModified('password')) {
    const saltRounds = 10;
    this.password = await bcrypt.hash(this.password, saltRounds);
  }

  next();
});
// custom method to compare and validate password for logging in
userSchema.methods.isCorrectPassword = async function (password) {
  return bcrypt.compare(password, this.password);
};
userSchema.virtual('totalCount').get(function () {
  var totalEvent = this.myCurrentEvent.length + this.myJoinedEvent.length
  return totalEvent ;
});

const User = model('User', userSchema);

module.exports = User;
