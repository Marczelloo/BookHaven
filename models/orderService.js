const Order = require('./order');
const Address = require('./orderAddress');
const Book = require('./book');
const mongoose = require('mongoose');
const shippingPrice = 5;

class OrderService {
    static async placeOrder(userId, orderData, cartItems) {
        const { name, surname, phoneNumber, address, city, country, zipCode } = orderData;

        if (!name || !surname || !phoneNumber || !address || !city || !country || !zipCode) {
            throw new Error('All fields are required');
        }

        if (!cartItems || cartItems.length === 0) {
            throw new Error('Cart is empty');
        }

        const bookIds = cartItems.map(item => item.bookId);
        const books = await Book.find({ _id: { $in: bookIds } });

        const items = books.map(book => {
            const item = cartItems.find(item => item.bookId.toString() === book._id.toString());
            return {
                book,
                quantity: item.quantity
            };
        });

        const subtotal = items.reduce((acc, item) => acc + item.book.price * item.quantity, 0);
        const discountPercent = subtotal > 100 ? 10 : subtotal > 200 ? 20 : 0;
        const discount = (discountPercent / 100) * subtotal;
        const total = (shippingPrice + subtotal) - discount;

        if (!total) {
            throw new Error('Error calculating total');
        }

        if (total <= 0) {
            throw new Error('Invalid total');
        }

        let parsedZipCode = zipCode;
        if (zipCode.includes('-')) {
            parsedZipCode = zipCode.replace('-', '');
        }

        const orderAddress = new Address({
            user: userId,
            name,
            surname,
            phoneNumber,
            address,
            city,
            country,
            zipCode: parsedZipCode
        });

        await orderAddress.save();

        const order = new Order({
            user: userId,
            items: items.map(item => ({
                bookId: item.book._id,
                quantity: item.quantity,
                price: item.book.price
            })),
            orderAddress: orderAddress._id,
            totalAmount: total,
        });

        await order.save();

        return order;
    }

    static async getOrderById(orderId) {
        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            throw new Error('Invalid order ID');
        }

        return await Order.findById(orderId)
            .populate('items.bookId')
            .populate('orderAddress')
            .populate('user', 'username email'); // Populate user details
    }

    static async getOrdersByUserId(userId) {
        return await Order.find({ user: userId })
            .populate('items.bookId')
            .populate('orderAddress');
    }

    static async updateOrderStatus(orderId, newStatus) {
        const order = await Order.findById(orderId);
        if (!order) {
            throw new Error('Order not found');
        }
        // Add validation for allowed status transitions if needed
        const allowedStatuses = ['pending_payment', 'payment_failed', 'processing', 'shipped', 'delivered', 'cancelled'];
        if (!allowedStatuses.includes(newStatus)) {
             throw new Error(`Invalid status: ${newStatus}`);
        }
        order.status = newStatus;
        await order.save();
        return order;
    }

    // Add the missing updateOrder method
    static async updateOrder(orderId, updateData) {
        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            throw new Error('Invalid order ID');
        }
        // Use findByIdAndUpdate to update the order with the provided data
        const updatedOrder = await Order.findByIdAndUpdate(orderId, { $set: updateData }, { new: true });
        if (!updatedOrder) {
            throw new Error('Order not found for update');
        }
        return updatedOrder;
    }
}

module.exports = OrderService;