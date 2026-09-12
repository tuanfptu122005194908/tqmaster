import fs from 'fs';
import { execSync } from 'child_process';

let users = [];

const csvPath = 'query-results-export-2026-09-13_01-30-49.csv';
if (fs.existsSync(csvPath)) {
  console.log(`Reading export CSV from ${csvPath}...`);
  const content = fs.readFileSync(csvPath, 'utf8');
  const firstNewline = content.indexOf('\n');
  let jsonStr = content.slice(firstNewline + 1).trim();
  if (jsonStr.startsWith('"') && jsonStr.endsWith('"')) {
    jsonStr = jsonStr.slice(1, -1).replace(/""/g, '"');
  }
  users = JSON.parse(jsonStr);
  console.log(`Successfully parsed ${users.length} users from ${csvPath}!`);
} else {
  const jsonPath = fs.existsSync('scripts/auth_users.json') 
    ? 'scripts/auth_users.json' 
    : (fs.existsSync('auth_users.json') ? 'auth_users.json' : 'scripts/batch1_users.json');
  users = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  console.log(`Starting import of ${users.length} users from ${jsonPath}...`);
}

// Fetch all existing users from target DB to map any mismatched email/ID
console.log('Fetching existing users from target DB...');
const fetchSql = "SELECT json_agg(json_build_object('id', id, 'email', lower(email))) FROM auth.users;";
fs.writeFileSync('scripts/temp_fetch.sql', fetchSql, 'utf8');
const out = execSync('npx supabase db query --linked --project-ref vhljgmtithjeovtrghvy --file "scripts/temp_fetch.sql" --output json', { encoding: 'utf8' });
if (fs.existsSync('scripts/temp_fetch.sql')) fs.unlinkSync('scripts/temp_fetch.sql');

const parsed = JSON.parse(out);
const dbUsers = parsed.rows?.[0]?.json_agg || [];
const dbUserByEmail = new Map();
for (const u of dbUsers) {
  if (u.email) dbUserByEmail.set(u.email, u.id);
}
console.log(`Found ${dbUsers.length} existing users in target DB.`);

// Re-map IDs for existing emails to avoid unique email constraint violations
let remappedCount = 0;
for (const u of users) {
  const email = (u.email || '').toLowerCase().trim();
  if (dbUserByEmail.has(email)) {
    const existingId = dbUserByEmail.get(email);
    if (existingId !== u.id) {
      u.id = existingId;
      remappedCount++;
    }
  }
}
console.log(`Remapped ${remappedCount} users to existing IDs.`);

function esc(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
  if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
  return String(val);
}

const chunks = [];
const CHUNK_SIZE = 50;

for (let i = 0; i < users.length; i += CHUNK_SIZE) {
  chunks.push(users.slice(i, i + CHUNK_SIZE));
}

let totalImported = 0;

for (let idx = 0; idx < chunks.length; idx++) {
  const chunk = chunks[idx];
  const userSqlValues = [];
  const identitySqlValues = [];

  for (const u of chunk) {
    const userMeta = {
      ...(u.raw_user_meta_data || {}),
      created_by_admin: 'true'
    };

    userSqlValues.push(`(
      ${esc(u.id)},
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      ${esc(u.email)},
      ${esc(u.encrypted_password)},
      ${esc(u.email_confirmed_at || u.created_at)},
      ${esc(u.raw_app_meta_data || { provider: 'email', providers: ['email'] })},
      ${esc(userMeta)},
      ${esc(u.created_at || new Date().toISOString())},
      ${esc(u.updated_at || new Date().toISOString())},
      '', '', '', '', '', '', '', ''
    )`);

    const provider = u.raw_app_meta_data?.provider || (u.encrypted_password ? 'email' : 'google');
    const providerId = (provider === 'email') ? u.id : (u.raw_user_meta_data?.provider_id || u.id);
    const identityData = u.raw_user_meta_data || { sub: u.id, email: u.email };

    identitySqlValues.push(`(
      gen_random_uuid(),
      ${esc(u.id)},
      ${esc(identityData)},
      ${esc(provider)},
      ${esc(providerId)},
      ${esc(u.updated_at || u.created_at || new Date().toISOString())},
      ${esc(u.created_at || new Date().toISOString())},
      ${esc(u.updated_at || new Date().toISOString())}
    )`);
  }

  const sql = `
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change,
  email_change_token_current, reauthentication_token, phone_change, phone_change_token
) VALUES
${userSqlValues.join(',\n')}
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  encrypted_password = CASE 
    WHEN EXCLUDED.email = 'admin@gmail.com' AND auth.users.encrypted_password IS NOT NULL THEN auth.users.encrypted_password
    ELSE COALESCE(EXCLUDED.encrypted_password, auth.users.encrypted_password)
  END,
  email_confirmed_at = COALESCE(auth.users.email_confirmed_at, EXCLUDED.email_confirmed_at),
  raw_app_meta_data = EXCLUDED.raw_app_meta_data,
  raw_user_meta_data = EXCLUDED.raw_user_meta_data,
  updated_at = NOW();

INSERT INTO auth.identities (
  id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
) VALUES
${identitySqlValues.join(',\n')}
ON CONFLICT (provider, provider_id) DO NOTHING;
`;

  const tempFile = `scripts/temp_batch_${idx}.sql`;
  fs.writeFileSync(tempFile, sql, 'utf8');

  try {
    execSync(`npx supabase db query --linked --project-ref vhljgmtithjeovtrghvy --file "${tempFile}"`, { stdio: 'pipe' });
    totalImported += chunk.length;
    console.log(`[Batch ${idx + 1}/${chunks.length}] Imported ${chunk.length} users (Total so far: ${totalImported})`);
  } catch (err) {
    console.error(`Error on batch ${idx + 1}:`, err.message);
    if (err.stdout) console.error('stdout:', err.stdout.toString());
    if (err.stderr) console.error('stderr:', err.stderr.toString());
    process.exit(1);
  } finally {
    if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
  }
}

console.log(`\nDONE! Successfully processed all ${totalImported} users with original encrypted passwords into auth.users!`);
