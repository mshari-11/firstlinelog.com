import { neon } from '@neondatabase/serverless';
export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const sql = neon(process.env.DATABASE_URL);
    const { action } = req.body;
    try {
          if (action === 'get_schema') {
                  const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
                  return res.status(200).json({ success: true, tables });
          }
          if (action === 'export_schema') {
                  const schema = await sql`SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' ORDER BY table_name`;
                  return res.status(200).json({ success: true, schema });
          }
          if (action === 'health_check') {
                  const result = await sql`SELECT NOW() as current_time`;
                  return res.status(200).json({ success: true, ...result[0] });
          }
          return res.status(400).json({ error: 'Invalid action' });
    } catch (error) {
          return res.status(500).json({ error: error.message });
    }
}
