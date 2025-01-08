const Order = require('../models/order');
const Address = require('../models/orderAddress');
const Book = require('../models/book');
const shippingPrice = 5;

exports.placeOrder = async (req, res) => {
   const { name, surname, phoneNumber, address, city, country, zipCode } = req.body;

   const userId = req.session.user._id;

   if(!name || !surname || !phoneNumber || !address || !city || !country || !zipCode) {
      return res.status(400).json({ message: 'All fields are required' });
   }

   const items = req.session.cart;

   if(!items || items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
   }

   const bookIds = items.map(item => item.bookId);

   const books = await Book.find({ _id: { $in: bookIds } });

   const cartItems = books.map(book => {
      const item = items.find(item => item.bookId.toString() === book._id.toString());
      return {
         book,
         quantity: item.quantity
      };
   });

   const subtotal = cartItems.reduce((acc, item) => acc + item.book.price * item.quantity, 0);
   const discountPercent = subtotal > 100 ? 10 : subtotal > 200 ? 20 : 0;
   const discount = (discountPercent / 100) * subtotal;
   const total = (shippingPrice + subtotal) - discount;

   if(!total) {
      return res.status(400).json({ message: 'Error calculating total' });
   }

   if(total <= 0) {
      return res.status(400).json({ message: 'Invalid total' });
   }

   let parsedZipCode = zipCode;
   if(zipCode.includes('-')) {
      parsedZipCode = zipCode.replace('-', '');
   }

   try {
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
         items: items,
         address: orderAddress._id,
         totalAmount: total
      })

      await order.save();

      req.session.cart = [];

      res.status(201).json({ message: 'Order added successfully' });
   } 
   catch(error) 
   {  
      console.error("Error adding order: ", error);
      res.status(500).json({ message: 'Error adding order', error });
   }
}

exports.getOrders = async (req, res) => {
   const userId = req.session.user._id;

   try 
   {
      const orders = await Order.find({ user: userId }).populate('items.book').populate('address');

      res.status(200).json(orders);
   } 
   catch(error) 
   {
      console.error("Error fetching orders: ", error);
      res.status(500).json({ message: 'Error fetching orders', error });
   }
};