import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// 仅在服务端 API Routes 中使用，拥有完整权限
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
