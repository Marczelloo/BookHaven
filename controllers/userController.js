const path = require('path');
const multer = require('multer');
const UserService = require('../models/userService');
const jwt = require('jsonwebtoken');
const { uploadFile, createSignedUrl } = require('../services/storageService');

const AVATARS_BUCKET = (process.env.SUPABASE_AVATARS_BUCKET || '').trim();
const AVATARS_PUBLIC = (process.env.SUPABASE_AVATARS_PUBLIC || '').toLowerCase() === 'true';
const storage = multer.memoryStorage();
const upload = multer({ storage });

async function uploadAvatarToSupabase(file, userId) {
   if (!file) return { avatarUrl: null, avatarPath: null };
   if (!AVATARS_BUCKET) {
      throw new Error('Supabase avatars bucket not configured');
   }

   const extension = path.extname(file.originalname) || '.jpg';
   const sanitizedUserId = (userId || 'anonymous').toString();
   const filePath = `avatars/${sanitizedUserId}-${Date.now()}${extension}`;

   const uploadResult = await uploadFile(
      AVATARS_BUCKET,
      filePath,
      file.buffer,
      file.mimetype || 'application/octet-stream'
   );

   if (!uploadResult.success) {
      throw new Error('Failed to upload avatar to storage');
   }

   let avatarUrl = uploadResult.publicUrl || null;

   // Prefer signed URLs when the bucket is private or if public URL is missing
   if (!AVATARS_PUBLIC || !avatarUrl) {
      const signed = await createSignedUrl(AVATARS_BUCKET, uploadResult.path, 60 * 60 * 24 * 365); // 1 year
      if (signed) {
         avatarUrl = signed;
      }
   }

   return {
      avatarUrl,
      avatarPath: uploadResult.path,
   };
}

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

exports.signin = async (req, res) => {
   const { email, password, rememberMe } = req.body;

   try {
      const user = await UserService.findUserByEmail(email);
      if (!user) return res.status(404).json({ message: 'User not found', email: true });
      
      const isMatch = await UserService.comparePassword(user, password);
      if (!isMatch) return res.status(400).json({ message: 'Invalid credentials', password: true });
      
      // Generate JWT tokens
      const accessToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '15m' });
      const refreshToken = jwt.sign({ userId: user._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: rememberMe ? '30d' : '7d' });

      // Set tokens in httpOnly cookies
      res.cookie('accessToken', accessToken, {
         httpOnly: true,
         secure: process.env.NODE_ENV === 'production',
         sameSite: 'lax',
         maxAge: 15 * 60 * 1000
      });
      
      res.cookie('refreshToken', refreshToken, {
         httpOnly: true,
         secure: process.env.NODE_ENV === 'production',
         sameSite: 'lax',
         maxAge: (rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000
      });

      // Remove session usage as JWT tokens are used for authentication
      // req.session.user = user;
      // if (rememberMe) req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; 
      // else req.session.cookie.expires = false; 

      const userResponse = user.toObject();
      delete userResponse.password;

      req.session.user = userResponse;

      res.status(200).json(userResponse);
   } catch (error) {
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

      let avatarUpload = { avatarUrl: null, avatarPath: null };
      if (req.file) {
         avatarUpload = await uploadAvatarToSupabase(req.file, req.session.user._id);
      }
      
      const updateFields = {};
      if (username) updateFields.username = username;
      if (email) updateFields.email = email;
      if (newPassword) updateFields.password = newPassword;

      if (avatarUpload.avatarUrl) {
         if (user.avatarPath) {
            await UserService.deleteUserAvatar(user.avatarPath);
         }
         updateFields.avatar = avatarUpload.avatarUrl;
         updateFields.avatarPath = avatarUpload.avatarPath;
      }

      await UserService.updateUser(req.session.user._id, updateFields);
      
      const updatedUser = await UserService.findUserById(req.session.user._id);
      const userResponse = { ...updatedUser.toObject() };

      delete userResponse.password;
      req.session.user = userResponse;

      res.status(200).json({ message: "Profile updated successfully", userResponse});
   }
   catch(error)
   {
      console.error('Error updating profile:', error);
      res.status(500).json({ message: 'Error updating profile', error });
   }
}]
