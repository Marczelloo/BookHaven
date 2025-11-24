const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.SUPABASE_ANON_KEY;

// Skip obviously invalid placeholders
const sanitizedServiceKey = serviceKey && serviceKey !== "your-service-role-key" ? serviceKey : undefined;
const supabaseKey = sanitizedServiceKey || anonKey;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase configuration missing. Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY/SUPABASE_ANON_KEY are set.");
}

// Basic JWT shape check to fail fast with a clearer error than "Invalid Compact JWS"
if (typeof supabaseKey !== "string" || supabaseKey.split(".").length !== 3) {
  throw new Error("Supabase key appears invalid. Please paste the full Service Role or anon key from Supabase settings.");
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function uploadFile(bucket, path, fileBuffer, contentType) {
  if (!bucket) {
    throw new Error("Supabase bucket name is required for upload.");
  }

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, fileBuffer, { contentType, upsert: true });

  if (error) {
    console.error("Supabase upload error:", error);
    return { success: false, error };
  }

  const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(path);

  return {
    success: true,
    path: data?.path || path,
    publicUrl: publicData?.publicUrl || null,
  };
}

async function removeFile(bucket, path) {
  if (!bucket || !path) return;
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) {
    console.error(`Supabase remove error for ${path}:`, error);
  }
}

async function createSignedUrl(bucket, path, expiresIn = 3600) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) {
    console.error(`Supabase signed URL error for ${path}:`, error);
    return null;
  }

  return data?.signedUrl || null;
}

module.exports = {
  uploadFile,
  removeFile,
  createSignedUrl,
};
