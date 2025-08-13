// src/components/admin/StatisticsManagementModule.jsx
import React, { useEffect, useState } from 'react';
import axiosInstance from '@/utils/axios';
import { BarChart3, TrendingUp, Home, Calendar, LineChart } from 'lucide-react';

const fmt = (n) => (typeof n === 'number' ? n.toLocaleString('vi-VN') : n ?? '—');

const TinyLine = ({ data = [] }) => {
  if (!data.length) return <div className="text-gray-500">Không có dữ liệu</div>;
  const w = 640, h = 160, pad = 12;
  const max = Math.max(...data.map(d => d.revenue), 1);
  const step = (w - pad * 2) / (data.length - 1 || 1);
  const pts = data.map((d, i) => {
    const x = pad + i * step;
    const y = h - pad - (d.revenue / max) * (h - pad * 2);
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} className="rounded-md border border-gray-200">
      <polyline fill="none" stroke="currentColor" strokeWidth="2" points={pts} />
    </svg>
  );
};

export default function StatisticsManagementModule() {
  // filters
  const [from, setFrom] = useState(() =>
    new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString().slice(0, 10)
  );
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [granularity, setGranularity] = useState('monthly');

  // data
  const [overview, setOverview] = useState(null);
  const [series, setSeries] = useState([]);
  const [topListings, setTopListings] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [catalog, setCatalog] = useState({ byRoomType: [], byCity: [] });
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [ovr, ser, tops, cus, cat] = await Promise.all([
        axiosInstance.get('/statistics/overview', { params: { from, to } }),
        axiosInstance.get('/statistics/revenue-series', { params: { from, to, granularity } }),
        axiosInstance.get('/statistics/top-listings', { params: { limit: 5 } }),
        axiosInstance.get('/statistics/customers', { params: { limit: 8 } }),
        axiosInstance.get('/statistics/catalog'),
      ]);
      setOverview(ovr.data);
      setSeries(ser.data.items || []);
      setTopListings(tops.data.items || []);
      setCustomers(cus.data.items || []);
      setCatalog(cat.data || {});
    } catch (err) {
      console.error('Load statistics error:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);
  useEffect(() => { load(); }, [from, to, granularity]);

  const orders = overview?.totals?.orders || {};
  const reservations = overview?.totals?.reservations || {};

  return (
    <div className="space-y-6">
      {/* Header + Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Statistics Management</h2>
            <p className="text-gray-600 mt-1">Analytics, reports, and business intelligence</p>
          </div>

          <div className="flex items-center gap-3">
            <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="border rounded-lg px-3 py-2" />
            <span>→</span>
            <input type="date" value={to} onChange={e => setTo(e.target.value)} className="border rounded-lg px-3 py-2" />
            <select value={granularity} onChange={e => setGranularity(e.target.value)} className="border rounded-lg px-3 py-2">
              <option value="daily">Daily</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <KPI icon={TrendingUp} title="Revenue" value={`${fmt(overview?.totals?.revenue)} ₫`} />
          <KPI icon={BarChart3} title="Paid Orders" value={fmt(orders.paid || 0)} subtitle={`Pending: ${fmt(orders.pending||0)} • Cancelled: ${fmt(orders.cancelled||0)}`} />
          <KPI icon={Calendar} title="Reservations" value={fmt((reservations.confirmed||0)+(reservations.completed||0))} subtitle={`Cancelled: ${fmt(reservations.cancelled||0)}`} />
          <KPI icon={Home} title="Listings" value={fmt(overview?.totals?.activeListings || 0)} subtitle={`Customers: ${fmt(overview?.totals?.customers || 0)}`} />
        </div>

        {/* AOV */}
        <div className="mt-4 text-sm text-gray-600">
          <span className="font-medium">Average order value: </span>
          {fmt(overview?.totals?.averageOrderValue || 0)} ₫
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <LineChart className="w-5 h-5" /> Revenue over time
          </h3>
          <div className="text-sm text-gray-500">{series.length} points</div>
        </div>
        {loading ? <div className="text-gray-500">Đang tải…</div> : <TinyLine data={series} />}
        <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-gray-600">
          {series.slice(-8).map((s) => (
            <div key={s.period} className="flex justify-between border rounded px-2 py-1">
              <span>{s.period}</span>
              <span>{fmt(s.revenue)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Top Listings by Revenue">
          <Table
            columns={['#', 'Listing', 'City', 'Orders', 'Revenue']}
            rows={topListings.map((x, i) => [i+1, x.title || `#${x.listing_id}`, x.city || '-', x.count, fmt(x.revenue)])}
          />
        </Card>
        <Card title="Top Customers by Revenue">
          <Table
            columns={['#', 'Customer', 'Payments', 'Revenue']}
            rows={customers.map((x, i) => [i+1, x.name || `User ${x.user_id}`, x.payments, fmt(x.revenue)])}
          />
        </Card>
      </div>

      {/* Catalog / Category */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Catalog insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-2">By Room Type</h4>
            <Table
              columns={['Room Type', 'Listings', 'Avg Nightly Price']}
              rows={catalog.byRoomType.map(x => [x._id || '-', fmt(x.listings), fmt(Math.round(x.avgPrice || 0))])}
            />
          </div>
          <div>
            <h4 className="font-medium mb-2">Top Cities</h4>
            <Table
              columns={['City', 'Listings', 'Avg Nightly Price']}
              rows={catalog.byCity.map(x => [x._id || '-', fmt(x.listings), fmt(Math.round(x.avgPrice || 0))])}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function KPI({ icon: Icon, title, value, subtitle }) {
  return (
    <div className="border rounded-xl p-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <div className="text-sm text-gray-500">{title}</div>
          <div className="text-xl font-semibold text-gray-900">{value ?? '—'}</div>
          {subtitle && <div className="text-xs text-gray-500 mt-0.5">{subtitle}</div>}
        </div>
      </div>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">{title}</h3>
      {children}
    </div>
  );
}

function Table({ columns, rows }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500">
            {columns.map(c => <th key={c} className="py-2 pr-4">{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t">
              {r.map((cell, j) => <td key={j} className="py-2 pr-4">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
