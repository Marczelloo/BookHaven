const mongoose = require('mongoose');
const md5 = require('md5');

const userSchema = new mongoose.Schema({
   username: {
      type: String,
      required: true,
      unique: true,
   },
   email: {
      type: String,
      required: true,
      unique: true,
   },
   password: {
      type: String,
      required: true,
   },
   avatar: {
      type: String,
      default: null
   },
   avatarPath: {
      type: String,
      default: null
   },
   orders: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
   }],
   cart: [{
      itemId: String,
      quantity: Number
   }],
   wishlist: [{
      itemId: String,
      addedDate: Date
   }],
})

userSchema.pre('save', function(next) {
   if(!this.isModified('password')) {
      return next();
   }

   try
   {
      this.password = md5(this.password);
      next();  
   }
   catch(err)
   {
      next(err);
   }
})

userSchema.methods.comparePassword = async function(candidatePassword) {
   candidatePassword = md5(candidatePassword);
   return candidatePassword === this.password;
}

const User = mongoose.model('User', userSchema);

module.exports = User;
