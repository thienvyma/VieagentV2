import { createClient } from '@supabase/supabase-js';

// Parse .env manually since we are not using dotenv package
// Simple parser for KEY=VALUE
import fs from 'fs';
const envContent = fs.readFileSync('.env', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, ...values] = line.split('=');
    if (key && values) {
        env[key.trim()] = values.join('=').trim();
    }
});

if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("❌ Missing Supabase keys in .env");
    process.exit(1);
}

const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
    console.log("🔍 Connecting to Supabase...");

    // Check system_config
    const { error: err1 } = await supabase.from('system_config').select('count', { count: 'exact', head: true });
    if (err1) {
        console.error("❌ Table 'system_config' check FAILED:", err1.message);
    } else {
        console.log("✅ Table 'system_config' exists.");
    }

    // Check purchases
    const { error: err2 } = await supabase.from('purchases').select('count', { count: 'exact', head: true });
    if (err2) {
        console.error("❌ Table 'purchases' check FAILED:", err2.message);
    } else {
        console.log("✅ Table 'purchases' exists.");
    }
}

check();
