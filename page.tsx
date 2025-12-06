"use client";

import { useEffect, useState } from "react";

interface DashboardData {
  totalCustomers: number;
  totalOrders: number;
  totalRevenue: number;
  recentOrders: any[];
  topProducts: any[];
}

export default function Dashboard() {
  const tenantId = "tenant_123"; // replace dynamically later

  const [data, setData] = useState<DashboardData>({
    totalCustomers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    recentOrders: [],
    topProducts: [],
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:5000/api/dashboard/${tenantId}`)
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch((err) => console.error(err));
  }, []);

  if (loading) return <div className="p-10 text-xl">Loading dashboard...</div>;

  return (
    <div className="p-10 space-y-8">

      {/* Header */}
      <h1 className="text-3xl font-bold">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-6">
        <div className="p-6 bg-white shadow-md rounded-lg">
          <h2 className="text-gray-500">Total Customers</h2>
          <p className="text-3xl font-bold">{data.totalCustomers}</p>
        </div>

        <div className="p-6 bg-white shadow-md rounded-lg">
          <h2 className="text-gray-500">Total Orders</h2>
          <p className="text-3xl font-bold">{data.totalOrders}</p>
        </div>

        <div className="p-6 bg-white shadow-md rounded-lg">
          <h2 className="text-gray-500">Total Revenue</h2>
          <p className="text-3xl font-bold">₹ {data.totalRevenue}</p>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white p-6 shadow-md rounded-lg">
        <h2 className="text-xl font-bold mb-4">Recent Orders</h2>

        <table className="w-full border">
          <thead>
            <tr className="bg-gray-200 text-left">
              <th className="p-3">Order ID</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Total</th>
            </tr>
          </thead>

          <tbody>
            {data.recentOrders.map((order, index) => (
              <tr key={index} className="border-t">
                <td className="p-3">{order.id}</td>
                <td className="p-3">{order.customerName}</td>
                <td className="p-3">₹ {order.totalPrice}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
