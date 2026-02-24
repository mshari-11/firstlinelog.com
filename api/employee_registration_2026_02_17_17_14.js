import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const sql = neon(process.env.DATABASE_URL);
    const { action, ...data } = req.body;
    try {
          await sql`CREATE TABLE IF NOT EXISTS employees_2026_02_17_17_14 (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), full_name TEXT NOT NULL, national_id TEXT UNIQUE NOT NULL, email TEXT UNIQUE NOT NULL, phone_number TEXT NOT NULL, work_city TEXT NOT NULL, work_app TEXT NOT NULL, status TEXT DEFAULT 'pending', created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW())`;
          if (action === 'register') {
                  const { fullName, nationalId, email, phoneNumber, workCity, workApp } = data;
                  const existing = await sql`SELECT id FROM employees_2026_02_17_17_14 WHERE national_id = ${nationalId} OR email = ${email}`;
                  if (existing.length > 0) return res.status(400).json({ success: false, error: 'Already registered' });
                  const result = await sql`INSERT INTO employees_2026_02_17_17_14 (full_name, national_id, email, phone_number, work_city, work_app) VALUES (${fullName}, ${nationalId}, ${email}, ${phoneNumber}, ${workCity}, ${workApp}) RETURNING id, full_name, status`;
                  return res.status(200).json({ success: true, employee: result[0] });
          }
          if (action === 'get_employees') {
                  const employees = await sql`SELECT * FROM employees_2026_02_17_17_14 ORDER BY created_at DESC`;
                  return res.status(200).json({ success: true, employees });
          }
          if (action === 'update_status') {
                  await sql`UPDATE employees_2026_02_17_17_14 SET status = ${data.status} WHERE id = ${data.employeeId}`;
                  return res.status(200).json({ success: true });
          }
          if (action === 'get_employee') {
                  const emp = await sql`SELECT * FROM employees_2026_02_17_17_14 WHERE phone_number = ${data.phoneNumber} OR national_id = ${data.nationalId} LIMIT 1`;
                  return emp.length > 0 ? res.status(200).json({ success: true, employee: emp[0] }) : res.status(404).json({ success: false, error: 'Not found' });
          }
          return res.status(400).json({ error: 'Invalid action' });
    } catch (error) {
          console.error('Employee API Error:', error);
          return res.status(500).json({ error: error.message });
    }
}
