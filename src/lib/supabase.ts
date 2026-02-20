import { createClient } from "@supabase/supabase-js";

const supabaseUrl = 'https://djebhztfewjfyyoortvv.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqZWJoenRmZXdqZnl5b29ydHZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwODE2OTYsImV4cCI6MjA4NjY1NzY5Nn0.763DeRupf7g8pP4USMRnYSNT8WJcgckCFaeh3D2wml8'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types
export interface Courier {
  id: string
  full_name: string
  full_name_ar?: string
  national_id?: string
  phone: string
  status: 'active' | 'inactive' | 'suspended' | 'on_leave'
  city?: string
  bank_name?: string
  join_date?: string
  contract_type?: string
  created_at: string
}

export interface Order {
  id: string
  courier_id: string
  platform: string
  order_date: string
  orders_count: number
  gross_earnings: number
  deductions: number
  net_earnings: number
  status: 'pending' | 'approved' | 'paid'
  created_at: string
}

export interface Finance {
  id: string
  courier_id: string
  month: number
  year: number
  total_orders: number
  gross_salary: number
  deductions: number
  bonus: number
  net_salary: number
  payment_status: 'pending' | 'approved' | 'paid'
}

export interface Complaint {
  id: string
  type: 'complaint' | 'request' | 'inquiry'
  source: 'internal' | 'platform' | 'customer'
  courier_id?: string
  subject: string
  description?: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  created_at: string
}

export interface Vehicle {
  id: string
  courier_id?: string
  plate_number: string
  vehicle_type?: string
  brand?: string
  model?: string
  status: 'active' | 'maintenance' | 'inactive'
  insurance_expiry?: string
  registration_expiry?: string
}
