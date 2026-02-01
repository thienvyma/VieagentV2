
import { createClient } from '@supabase/supabase-js';

// Read from process.env (assuming dotenv or env-file is used)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const usersToSeed = [
    {
        email: 'thienvyma@gmail.com',
        password: '151194Vy@',
        role: 'admin',
        full_name: 'Thien Vy Admin'
    },
    {
        email: 'user@vieagent.vn',
        password: 'admin123',
        role: 'customer',
        full_name: 'Regular User'
    }
];

async function seed() {
    console.log('🌱 Starting user seed...');

    for (const user of usersToSeed) {
        console.log(`Processing: ${user.email}`);

        // 1. Check if user exists in Auth
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
        if (listError) {
            console.error('Error listing users:', listError);
            continue;
        }

        const existingUser = users.find(u => u.email === user.email);
        let userId = existingUser?.id;

        if (existingUser) {
            console.log(`User ${user.email} already exists (ID: ${userId}). Updating password...`);
            const { error: updateError } = await supabase.auth.admin.updateUserById(userId!, {
                password: user.password,
                user_metadata: { full_name: user.full_name },
                email_confirm: true
            });
            if (updateError) console.error(`Error updating user: ${updateError.message}`);
        } else {
            console.log(`Creating user ${user.email}...`);
            const { data, error: createError } = await supabase.auth.admin.createUser({
                email: user.email,
                password: user.password,
                email_confirm: true,
                user_metadata: { full_name: user.full_name }
            });

            if (createError) {
                console.error(`Error creating user: ${createError.message}`);
                continue;
            }
            userId = data.user.id;
        }

        // 2. Update Role in public.users
        // The trigger 'on_auth_user_created' adds the entry to public.users automatically on INSERT.
        // But for upgrades or existing users, we explicitly update.
        if (user.role === 'admin') {
            console.log(`Granting ADMIN role to ${user.email}...`);
            const { error: roleError } = await supabase
                .from('users')
                .update({ role: 'admin' })
                .eq('id', userId);

            if (roleError) console.error(`Error update role: ${roleError.message}`);
            else console.log('✅ Admin role granted.');
        } else {
            // Optional: Ensure role is customer
            //  console.log(`Ensuring CUSTOMER role to ${user.email}...`);
            //  await supabase.from('users').update({ role: 'customer' }).eq('id', userId);
        }
    }

    console.log('✨ Seed completed.');
}

seed();
