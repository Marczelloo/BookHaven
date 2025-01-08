const User = require('../models/user');

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
      res.status(200).json({ message: 'User signed out successfully' });
   })
}