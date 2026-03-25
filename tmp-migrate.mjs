import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// 手动解析 .env.local
const envContent = readFileSync(new URL('.env.local', import.meta.url), 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim();
}

const sb = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

// 检测 visual 列是否存在
const { data, error } = await sb.from('characters').select('visual').limit(1);
if (error) {
  console.log('visual column not found, adding it now...');
  
  // 通过 Supabase Management API 执行 SQL
  const projectRef = env.NEXT_PUBLIC_SUPABASE_URL.match(/https:\/\/([^.]+)/)?.[1];
  
  // 使用 pg REST 直接通过 service key 执行 — Supabase 不暴露直接 SQL 给 REST API
  // 改用 rpc 调用执行 SQL
  const resp = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({})
  });
  
  console.log('Cannot add column via REST API. Please run this SQL in Supabase Dashboard SQL Editor:');
  console.log('');
  console.log('  ALTER TABLE characters ADD COLUMN visual JSONB DEFAULT NULL;');
  console.log('');
  console.log('Dashboard URL: https://supabase.com/dashboard/project/' + projectRef + '/sql');
} else {
  console.log('visual column already exists! Sample:', JSON.stringify(data));
}
