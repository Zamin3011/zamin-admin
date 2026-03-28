"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

import {
  Users,
  Smartphone,
  Activity,
  AlertTriangle,
} from "lucide-react";

export default function Dashboard() {
  const [devices, setDevices] = useState<any[]>([]);
  const [distributors, setDistributors] = useState<any[]>([]);

  // ===============================
  // 🔄 Fetch Data
  // ===============================
  const fetchData = async () => {
    const deviceSnap = await getDocs(collection(db, "licensed_devices"));
    const distSnap = await getDocs(collection(db, "distributors"));

    const distMap: any = {};
    distSnap.forEach((d) => {
      distMap[d.id] = d.data();
    });

    const deviceList: any[] = [];
    deviceSnap.forEach((docSnap) => {
      const data = docSnap.data();
      const distributor = distMap[data.distributor_id];

      deviceList.push({
        id: docSnap.id,
        ...data,
        distributor_active: distributor?.active ?? true,
      });
    });

    const distList: any[] = [];
    distSnap.forEach((d) =>
      distList.push({ id: d.id, ...d.data() })
    );

    setDevices(deviceList);
    setDistributors(distList);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ===============================
  // 📊 Calculations
  // ===============================
  const totalDevices = devices.length;

  const activeDevices = devices.filter(
    (d) => d.pro_override && d.distributor_active !== false
  ).length;

  // ✅ FIXED EXPIRY (ignore lifetime = 0)
  const expiredDevices = devices.filter(
    (d) =>
      d.expires_at > 0 &&
      d.expires_at < Date.now()
  ).length;

  // 🟢 Online devices
  const onlineDevices = devices.filter(
    (d) =>
      d.last_seen &&
      Date.now() - d.last_seen < 2 * 60 * 1000
  ).length;

  const totalDistributors = distributors.length;

  const disabledDistributors = distributors.filter(
    (d) => d.active === false
  ).length;

  // 📊 Usage %
  const usagePercent =
    totalDevices === 0
      ? 0
      : Math.round((activeDevices / totalDevices) * 100);

  // 🔥 Overloaded distributors
  const overloadedDistributors = distributors.filter((dist) => {
    const count = devices.filter(
      (d) => d.distributor_id === dist.id
    ).length;

    return count >= (dist.max_devices || 0);
  }).length;

  // ===============================
  // UI
  // ===============================
  return (
    <div>

      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {/* 🔥 Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">

        <div className="bg-white p-4 rounded-xl shadow flex items-center gap-3">
          <Smartphone className="text-blue-500" />
          <div>
            <p className="text-gray-500 text-sm">Total Devices</p>
            <p className="text-xl font-bold">{totalDevices}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow flex items-center gap-3">
          <Activity className="text-green-500" />
          <div>
            <p className="text-gray-500 text-sm">Active Devices</p>
            <p className="text-xl font-bold text-green-600">
              {activeDevices}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow flex items-center gap-3">
          <AlertTriangle className="text-red-500" />
          <div>
            <p className="text-gray-500 text-sm">Expired Devices</p>
            <p className="text-xl font-bold text-red-600">
              {expiredDevices}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow flex items-center gap-3">
          <Activity className="text-green-400" />
          <div>
            <p className="text-gray-500 text-sm">Online Devices</p>
            <p className="text-xl font-bold text-green-500">
              {onlineDevices}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow flex items-center gap-3">
          <Users className="text-purple-500" />
          <div>
            <p className="text-gray-500 text-sm">Distributors</p>
            <p className="text-xl font-bold">
              {totalDistributors}
            </p>
          </div>
        </div>

      </div>

      {/* 📊 Extra Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <div className="bg-white p-4 rounded-xl shadow">
          <h2 className="text-gray-500 mb-2">System Health</h2>

          <div className="space-y-2 text-sm">
            <p>Active Devices: {activeDevices}</p>
            <p>Expired Devices: {expiredDevices}</p>
            <p>Disabled Distributors: {disabledDistributors}</p>
            <p>Overloaded Distributors: {overloadedDistributors}</p>
            <p>Usage: {usagePercent}%</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow">
          <h2 className="text-gray-500 mb-2">Insights</h2>

          <div className="space-y-2 text-sm">

            <p>
              {activeDevices > 0
                ? "System is running normally ✅"
                : "No active devices ⚠️"}
            </p>

            <p>
              {expiredDevices > totalDevices * 0.3
                ? "Many expired devices — check renewals ⚠️"
                : "Expiry levels normal ✅"}
            </p>

            <p>
              {overloadedDistributors > 0
                ? "Some distributors are full ⚠️"
                : "Distributor load is balanced ✅"}
            </p>

          </div>
        </div>

      </div>

    </div>
  );
}