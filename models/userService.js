const User = require('./user');
const Order = require('./order');
const mongoose = require('mongoose'); // Use Mongoose's ObjectId
const { removeFile } = require('../services/storageService');

class UserService {
    static async findUserById(userId) {
        return await User.findById(userId);
    }

    static async findUserByEmail(email) {
        return await User.findOne({ email });
    }

    static async createUser(userData) {
        const newUser = new User(userData);
        await newUser.save();
        return newUser;
    }

    static async updateUser(userId, updateFields) {
      return await User.findByIdAndUpdate(userId, { $set: updateFields }, { new: true });
   }

    static async deleteUserAvatar(avatarPath) {
        const bucket = process.env.SUPABASE_AVATARS_BUCKET;
        if (!bucket || !avatarPath) return;
        await removeFile(bucket, avatarPath);
    }

    static async getUserOrders(userId) {
        const orders = await Order.find({ user: userId })
            .populate('items.bookId')
            .populate('orderAddress');

        orders.forEach(order => {
            order.totalAmount = order.totalAmount.toFixed(2);
            order.formattedOrderDate = new Date(order.orderDate).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        });

        return orders;
    }

    static async comparePassword(user, password) {
        return await user.comparePassword(password);
    }
}

module.exports = UserService;
