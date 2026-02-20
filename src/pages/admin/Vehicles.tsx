import { useState, useEffect } from 'react';
import { Truck, Plus, Search, Car, Bike, Package } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const mockVehicles = [
  { id: 1, plate: 'ABC-1234', type: 'دراجة نارية', brand: 'هوندا', year: 2022, courier: 'أحمد محمد', city: 'الرياض', status: 'active', lastService: '2025-12-01' },
  { id: 2, plate: 'XYZ-5678', type: 'سيارة', brand: 'تويوتا', year: 2021, courier: 'محمد علي', city: 'جدة', status: 'maintenance', lastService: '2025-11-15' },
  { id: 3, plate: 'DEF-9012', type: 'دراجة هوائية', brand: 'جاينت', year: 2023, courier: 'خالد سعد', city: 'الدمام', status: 'active', lastService: '2026-01-10' },
  { id: 4, plate: 'GHI-3456', type: 'دراجة نارية', brand: 'ياماها', year: 2020, courier: 'عمر حسن', city: 'الرياض', status: 'inactive', lastService: '2025-10-20' },
  { id: 5, plate: 'JKL-7890', type: 'سيارة', brand: 'هيونداي', year: 2022, courier: 'يوسف أحمد', city: 'مكة', status: 'active', lastService: '2026-01-20' },
];

const statusMap: Record<string, { label: string; color: string }> = {
  active: { label: 'نشط', color: 'bg-green-500/20 text-green-400' },
  maintenance: { label: 'صيانة', color: 'bg-yellow-500/20 text-yellow-400' },
  inactive: { label: 'غير نشط', color: 'bg-red-500/20 text-red-400' },
};

const typeIcon = (type: string) => {
  if (type === 'سيارة') return <Car className="w-4 h-4" />;
  if (type === 'دراجة هوائية') return <Bike className="w-4 h-4" />;
  return <Truck className="w-4 h-4" />;
};

export default function Vehicles() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [vehicles, setVehicles] = useState(mockVehicles);

  useEffect(() => {
    async function fetchVehicles() {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*, couriers(full_name, city)')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const mapped = data.map((v: any) => ({
          id: v.id,
          plate: v.plate_number || '',
          type: v.vehicle_type || 'دراجة نارية',
          brand: v.brand || '',
          year: v.year || 2022,
          courier: v.couriers?.full_name || 'غير محدد',
          city: v.couriers?.city || '',
          status: v.status || 'active',
          lastService: v.last_service_date || '',
        }));
        setVehicles(mapped);
      }
    }
    fetchVehicles();
  }, []);

  const filtered = vehicles.filter(v => {
    const matchSearch = v.plate.includes(search) || v.courier.includes(search) || v.brand.includes(search);
    const matchStatus = statusFilter === 'all' || v.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: vehicles.length,
    active: vehicles.filter(v => v.status === 'active').length,
    maintenance: vehicles.filter(v => v.status === 'maintenance').length,
    inactive: vehicles.filter(v => v.status === 'inactive').length,
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">المركبات</h1>
          <p className="text-blue-300/60 text-sm mt-1">إدارة مركبات المناديب</p>
        </div>
        <button className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-4 py-2 rounded-xl transition-colors">
          <Plus className="w-4 h-4" />
          إضافة مركبة
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'إجمالي المركبات', value: stats.total, color: 'text-blue-400', icon: <Truck className="w-5 h-5" /> },
          { label: 'نشطة', value: stats.active, color: 'text-green-400', icon: <Car className="w-5 h-5" /> },
          { label: 'في الصيانة', value: stats.maintenance, color: 'text-yellow-400', icon: <Package className="w-5 h-5" /> },
          { label: 'غير نشطة', value: stats.inactive, color: 'text-red-400', icon: <Bike className="w-5 h-5" /> },
        ].map((stat, i) => (
          <div key={i} className="bg-blue-950/60 rounded-2xl p-4 border border-blue-700/30">
            <div className={`${stat.color} mb-2`}>{stat.icon}</div>
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-blue-300/60 text-sm">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-blue-950/60 rounded-2xl border border-blue-700/30 p-5">
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-300/60" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="بحث بالرقم، الماركة، أو المندوب..."
              className="w-full bg-blue-900/50 border border-blue-700/30 rounded-xl pr-10 pl-4 py-2.5 text-white placeholder-blue-400/50 text-sm focus:outline-none focus:border-cyan-500/50"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-blue-900/50 border border-blue-700/30 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500/50"
          >
            <option value="all">جميع الحالات</option>
            <option value="active">نشط</option>
            <option value="maintenance">صيانة</option>
            <option value="inactive">غير نشط</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-blue-700/30">
                {['النوع', 'رقم اللوحة', 'الماركة / السنة', 'المندوب', 'المدينة', 'آخر صيانة', 'الحالة'].map(h => (
                  <th key={h} className="text-right text-blue-300/60 font-medium py-3 px-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {filtered.map(v => (
                <tr key={v.id} className="hover:bg-slate-700/20 transition-colors">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2 text-blue-100">
                      {typeIcon(v.type)}
                      <span>{v.type}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-white font-mono">{v.plate}</td>
                  <td className="py-3 px-3