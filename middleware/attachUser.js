const { createSignedUrl } = require('../services/storageService');

const AVATARS_BUCKET = (process.env.SUPABASE_AVATARS_BUCKET || '').trim();
const AVATARS_PUBLIC = (process.env.SUPABASE_AVATARS_PUBLIC || '').toLowerCase() === 'true';

module.exports = async (req, res, next) => {
   if (req.session.user)
   {
      let avatarUrl = req.session.user.avatar;

      if (!AVATARS_PUBLIC && req.session.user.avatarPath) {
         const signedUrl = await createSignedUrl(AVATARS_BUCKET, req.session.user.avatarPath, 60 * 60 * 24 * 7); // 7 days
         if (signedUrl) {
            avatarUrl = signedUrl;
            req.session.user.avatar = avatarUrl; // keep session in sync
         }
      }

      res.locals.user = {
         avatar: avatarUrl,
         username: req.session.user.username,
      };
   }
   else
   {
      res.locals.user = null;
   }
   next();
}
