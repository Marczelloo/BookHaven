const path = require('path');
const multer = require('multer');
const UserService = require('../models/userService');

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

   if (password !== passwordConfirm) 
   {
      return res.status(400).json({ message: 'Passwords do not match', password: true });
   }

   try 
   {
      const existingUser = await UserService.findUserByEmail(email);
      if (existingUser) return res.status(400).json({ message: 'Email already in use', email: true });

      const newUser = await UserService.createUser({ username, email, password });
      
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
      const user = await UserService.findUserByEmail(email);
      if (!user) return res.status(404).json({ message: 'User not found', email: true });
      

      const isMatch = await UserService.comparePassword(user, password);
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
      const orders = await UserService.getUserOrders(userId);

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
      const user = await UserService.findUserById(req.session.user._id);

      if(!user) return res.status(404).json({ message: 'User not found' });

      if (email && email !== user.email) 
      {
         const existingUser = await UserService.findUserByEmail(email);
         if (existingUser) 
         {
             console.log('Email already exists:', email);
             return res.status(400).json({ message: 'Email already exists', email: true });
         }
      }

      if (avatar && user.avatar) 
      {
         await UserService.deleteUserAvatar(user.avatar);
      }
      
      const updateFields = {};
      if (username) updateFields.username = username;
      if (email) updateFields.email = email;
      if (newPassword) updateFields.password = newPassword;
      if (avatar) updateFields.avatar = avatar;

      await UserService.updateUser(req.session.user._id, updateFields);
      
      const updatedUser = await UserService.findUserById(req.session.user._id);
      const userResponse = { ...updatedUser.toObject() };

      delete userResponse.password;
      req.session.user = updatedUser;

      res.status(200).json({ message: "Profile updated successfully", userResponse});
   }
   catch(error)
   {
      console.error('Error updating profile:', error);
      res.status(500).json({ message: 'Error updating profile', error });
   }
}]