import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const envContent = readFileSync('.env.local', 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim();
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// 1. 找出所有重复名字的用户
const { data: allUsers } = await sb.from('users').select('id,name,code,created_at').order('created_at');
const nameMap = {};
for (const u of allUsers) {
  if (!nameMap[u.name]) nameMap[u.name] = [];
  nameMap[u.name].push(u);
}

const dupes = Object.entries(nameMap).filter(([, users]) => users.length > 1);
console.log(`Found ${dupes.length} duplicate name groups:`);
for (const [name, users] of dupes) {
  console.log(`  ${name}: ${users.map(u => `${u.code}(${u.id.slice(0,8)})`).join(', ')}`);
}

// 2. 删除重复用户中后创建的那些（保留最早的）
for (const [name, users] of dupes) {
  const sorted = users.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  const keep = sorted[0];
  const toDelete = sorted.slice(1);
  console.log(`\nKeeping ${name}/${keep.code} (${keep.id.slice(0,8)}), deleting ${toDelete.length} duplicates...`);
  
  for (const dup of toDelete) {
    // 删除该用户的角色
    const { error: charErr } = await sb.from('characters').delete().eq('user_id', dup.id).eq('is_system', false);
    if (charErr) console.log(`  ⚠ delete chars for ${dup.id}: ${charErr.message}`);
    
    // 删除该用户关联的对战记录（作为 player1 或 player2 的角色的对战）
    // 先查角色ID
    
    // 删除用户的 daily_limits
    const { error: limErr } = await sb.from('daily_limits').delete().eq('user_id', dup.id);
    if (limErr) console.log(`  ⚠ delete limits for ${dup.id}: ${limErr.message}`);
    
    // 删除用户
    const { error: userErr } = await sb.from('users').delete().eq('id', dup.id);
    if (userErr) console.log(`  ⚠ delete user ${dup.id}: ${userErr.message}`);
    else console.log(`  ✓ Deleted ${name}/${dup.code} (${dup.id.slice(0,8)})`);
  }
}

// 3. 验证清理结果
const { data: remaining } = await sb.from('users').select('name').order('name');
const afterMap = {};
for (const u of remaining) {
  afterMap[u.name] = (afterMap[u.name] || 0) + 1;
}
const afterDupes = Object.entries(afterMap).filter(([, count]) => count > 1);
console.log(`\nAfter cleanup: ${remaining.length} users, ${afterDupes.length} duplicate names remaining`);

// 4. 尝试加 UNIQUE 约束
console.log('\nAdding UNIQUE constraint on users.name...');
const { error: indexErr } = await sb.rpc('exec_sql', {
  sql: 'CREATE UNIQUE INDEX IF NOT EXISTS users_name_unique ON users (name)'
});
if (indexErr) {
  console.log('⚠ Could not add via rpc:', indexErr.message);
  console.log('→ Need to add manually in Supabase SQL Editor:');
  console.log('  CREATE UNIQUE INDEX IF NOT EXISTS users_name_unique ON users (name);');
} else {
  console.log('✓ UNIQUE index added successfully');
}
