// pages/api/profile.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { id, name, avatar_url } = req.body;

  const { error } = await supabase
    .from('profiles')
    .upsert({ id, username: name, avatar_url });

  if (error) {
    console.error(error);
    return res.status(500).json({ error: 'DB 저장 실패' });
  }

  return res.status(200).json({ success: true });
}