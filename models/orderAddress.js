const mongoose = require('mongoose');

const orderAddressSchema = new mongoose.Schema({
   user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
   },
   name: {
      type: String,
      required: true,
   },
   surname: {
      type: String,
      required: true,
   },
   address: {
      type: String,
      required: true,
   },
   city: {
      type: String,
      required: true,
   },
   country: {
      type: String,
      required: true,
   },
   zipCode: {
      type: Number,
      required: true,
   },
   phoneNumber: {
      type: Number,
      required: true,
   },
})

const OrderAddress = mongoose.model('OrderAddress', orderAddressSchema);

module.exports = OrderAddress;