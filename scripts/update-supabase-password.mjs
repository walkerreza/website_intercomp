import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";

function readDotEnvValue(name) {
  if (!existsSync(".env")) return "";

  const lines = readFileSync(".env", "utf8").split(/\r?\n/);
  const match = lines.find((line) => line.startsWith(`${name}=`));
  return match ? match.slice(name.length + 1).trim() : "";
}

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  readDotEnvValue("VITE_SUPABASE_URL");
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const userId = process.env.SUPABASE_USER_ID;
const newPassword = process.env.SUPABASE_NEW_PASSWORD;

function requireEnv(name, value) {
  if (!value) {
    throw new Error(`Missing ${name}. Set it before running this script.`);
  }
}

requireEnv("SUPABASE_URL or VITE_SUPABASE_URL", supabaseUrl);
requireEnv("SUPABASE_SERVICE_ROLE_KEY", serviceRoleKey);
requireEnv("SUPABASE_USER_ID", userId);
requireEnv("SUPABASE_NEW_PASSWORD", newPassword);

if (newPassword.length < 6) {
  throw new Error("SUPABASE_NEW_PASSWORD must be at least 6 characters.");
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
  password: newPassword,
});

if (error) {
  throw error;
}

console.log(`Password updated for ${data.user.email ?? data.user.id}.`);
