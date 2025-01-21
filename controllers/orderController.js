const OrderService = require("../models/orderService");

exports.placeOrder = async (req, res) => {
   const { name, surname, phoneNumber, address, city, country, zipCode } = req.body;

   const userId = req.session.user._id;

   try
   {
      const orderData = { name, surname, phoneNumber, address, city, country, zipCode };
      const cartItems = req.session.cart;

      const order = await OrderService.placeOrder(userId, orderData, cartItems);

      req.session.cart = [];

      res.status(201).json({ message: 'Order added successfully' });
   } 
   catch(error) 
   {  
      console.error("Error adding order: ", error);
      res.status(500).json({ message: 'Error adding order', error });
   }
}