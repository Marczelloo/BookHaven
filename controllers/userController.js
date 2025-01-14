const User = require('../models/user');
const path = require('path');
const multer = require('multer');
const Order = require('../models/order');
const fs = require('fs');

const storage = multer.diskStorage({
   destination: (req, file, cb) => {
      cb(null, 'uploads/avatars/');
    },
    filename: (req, file, cb) => {
      cb(null, `${req.session.user._id}-${Date.now()}${path.extname(file.originalname)}`);
    }
})

const upload = multer({ storage });

exports.signup = async (req, res) => 
{
   const { username, email, password, passwordConfirm } = req.body;

   console.log(req.body);

   if (password !== passwordConfirm) 
   {
      return res.status(400).json({ message: 'Passwords do not match', password: true });
   }

   try 
   {
      const existingUser = await User.findOne({ email });
      if (existingUser) return res.status(400).json({ message: 'Email already in use', email: true });
      

      const newUser = new User({
         username,
         email,
         password
      });

      await newUser.save();

      req.session.user = newUser;

      const userResponse = newUser.toObject();
      delete userResponse.password;

      res.status(201).json(userResponse);
   } 
   catch (error) 
   {
      res.status(500).json({ message: 'Error creating user', error });
   }
};

exports.signin = async (req, res) => 
{
   const { email, password, rememberMe } = req.body;

   try 
   {
      const user = await User.findOne({ email });
      if (!user) return res.status(404).json({ message: 'User not found', email: true });
      

      const isMatch = await user.comparePassword(password);
      if (!isMatch) return res.status(400).json({ message: 'Invalid credentials', password: true });
      
      req.session.user = user;

      if (rememberMe) req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; 
      else req.session.cookie.expires = false; 

      const userResponse = user.toObject();
      delete userResponse.password;

      res.status(200).json(userResponse);
   } 
   catch (error) 
   {
      res.status(500).json({ message: 'Error signing in', error });
   }
};

exports.signout = (req, res) => {
   req.session.destroy((error) => {
      if(error) return res.status(500).json({ message: 'Error signing out', error });

      res.clearCookie('connect.sid');
      res.redirect('/');
   })
}

exports.getProfile = async (req, res) => {
   const userId = req.session.user._id;

   try 
   {
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

      res.render('profilePage', { title: 'Profile', orders, user: req.session.user });
   } 
   catch (error) 
   {
       console.error('Error fetching profile:', error);
       res.status(500).send({ message: 'Error fetching profile', error });
   }
};

exports.updateProfile = [upload.single('avatar'), async (req, res) => {
   const { username, email, newPassword } = req.body;
   const avatar = req.file ? `/uploads/avatars/${req.file.filename}` : null;

   try
   {
      const user = await User.findById(req.session.user._id);

      if(!user) return res.status(404).json({ message: 'User not found' });

      if (email && email !== user.email) {
         const existingUser = await User.findOne({ email });
         if (existingUser) {
            console.log('Email already exists:', email);
            return res.status(400).json({ message: 'Email already exists', email: true });
         }
      }

      if (avatar && user.avatar) {
         const previousAvatarPath = path.join(__dirname, '..', user.avatar);
         fs.unlink(previousAvatarPath, (err) => {
             if (err) console.error('Error removing previous avatar:', err);
             else console.log('Previous avatar removed:', previousAvatarPath);
         });
     }
      
      if(username) user.username = username;
      if(email) user.email = email;
      if(newPassword) user.password = newPassword;
      if(avatar) user.avatar = avatar;

      await user.save();

      const userResponse = user.toObject();
      delete userResponse.password;

      req.session.user = user;

      res.status(200).json({ message: "Profile updated successfully", userResponse});
   }
   catch(error)
   {
      console.error('Error updating profile:', error);
      res.status(500).json({ message: 'Error updating profile', error });
   }
}]