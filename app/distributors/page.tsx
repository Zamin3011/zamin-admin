"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  setDoc,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";

import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Power,
} from "lucide-react";

export default function DistributorsPage() {
  const [distributors, setDistributors] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [selectedDistributor, setSelectedDistributor] = useState<any>(null);

  const [name, setName] = useState("");
  const [maxDevices, setMaxDevices] = useState("");
  const [search, setSearch] = useState("");

  // ===============================
  // 🔄 Fetch Data
  // ===============================
  const fetchData = async () => {
    const distSnap = await getDocs(collection(db, "distributors"));
    const devSnap = await getDocs(collection(db, "licensed_devices"));

    const deviceList: any[] = [];
    devSnap.forEach((d) => deviceList.push({ id: d.id, ...d.data() }));

    const distList: any[] = [];

    distSnap.forEach((docSnap) => {
      const data = docSnap.data();

      const count = deviceList.filter(
        (d) => d.distributor_id === docSnap.id
      ).length;

      distList.push({
        id: docSnap.id,
        ...data,
        device_count: count,
      });
    });

    setDevices(deviceList);
    setDistributors(distList);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ===============================
  // ➕ Add Distributor
  // ===============================
  const addDistributor = async () => {
    if (!name || !maxDevices) return;

    const id = name.toLowerCase().replace(/\s+/g, "_");

    await setDoc(doc(db, "distributors", id), {
      name,
      active: true,
      max_devices: Number(maxDevices),
      created_at: Date.now(),
    });

    setName("");
    setMaxDevices("");
    fetchData();
  };

  // ===============================
  // 🗑️ Delete
  // ===============================
  const deleteDistributor = async (id: string) => {
    if (!confirm("Delete this distributor?")) return;

    await deleteDoc(doc(db, "distributors", id));
    fetchData();
  };

  // ===============================
  // ✏️ Edit Limit
  // ===============================
  const editLimit = async (id: string, current: number) => {
    const newLimit = prompt("New max devices:", String(current));
    if (!newLimit || isNaN(Number(newLimit))) return;

    await updateDoc(doc(db, "distributors", id), {
      max_devices: Number(newLimit),
    });

    fetchData();
  };

  // ===============================
  // 🔥 Toggle Active
  // ===============================
  const toggleActive = async (id: string, current: boolean) => {
    await updateDoc(doc(db, "distributors", id), {
      active: !current,
    });

    fetchData();
  };

  const setDistributorExpiry = async (distId: string) => {
    const input = prompt(
      "Enter days OR 'lifetime' for ALL devices of this distributor"
    );

    if (!input) return;

    let expiry = 0;

    if (input.toLowerCase() === "lifetime") {
      expiry = 0;
    } else if (!isNaN(Number(input))) {
      const days = Number(input);

      expiry =
        days === 0
          ? 0
          : Date.now() + days * 24 * 60 * 60 * 1000;
    } else {
      alert("Invalid input");
      return;
    }

    const affectedDevices = devices.filter(
      (d) => d.distributor_id === distId
    );

    const updates = affectedDevices.map((d) =>
      updateDoc(doc(db, "licensed_devices", d.id), {
        expires_at: expiry,
      })
    );

    await Promise.all(updates);

    alert("✅ Expiry updated for all devices");
    fetchData();
  };

  // ===============================
  // 👁️ View Devices
  // ===============================
  const viewDevices = (distId: string) => {
    const list = devices.filter((d) => d.distributor_id === distId);
    setSelectedDistributor({ id: distId, devices: list });
  };

  // ===============================
  // UI
  // ===============================
  return (
    <div>

      <h1 className="text-2xl font-bold mb-6">Distributors</h1>

      {/* ➕ Add + Search */}
      <div className="flex gap-3 mb-4">

        <div className="flex items-center border rounded px-2">
          <Search size={16} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search distributor..."
            className="p-2 outline-none"
          />
        </div>

        <div className="flex items-center border rounded px-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Distributor Name"
            className="p-2 outline-none"
          />
        </div>

        <div className="flex items-center border rounded px-2">
          <input
            value={maxDevices}
            onChange={(e) => setMaxDevices(e.target.value)}
            placeholder="Max Devices"
            className="p-2 outline-none w-24"
          />
        </div>

        <button
          onClick={addDistributor}
          className="bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2"
        >
          <Plus size={16} /> Add
        </button>

      </div>

      {/* 📊 Table */}
      <div className="bg-white rounded-xl shadow">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3">ID</th>
              <th className="p-3">Max</th>
              <th className="p-3">Usage</th>
              <th className="p-3">Status</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {distributors
              .filter((d) =>
                d.name?.toLowerCase().includes(search.toLowerCase())
              )
              .map((d) => (
                <tr key={d.id} className="border-t hover:bg-gray-50">

                  <td className="p-3 font-medium">{d.name}</td>

                  <td className="p-3 text-gray-500">{d.id}</td>

                  <td className="p-3">{d.max_devices}</td>

                  <td className="p-3">
                    {d.device_count} / {d.max_devices}
                  </td>

                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        d.active
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {d.active ? "Active" : "Disabled"}
                    </span>
                  </td>

                  <td className="p-3 flex gap-3 justify-center">

                    <button
                      onClick={() => editLimit(d.id, d.max_devices)}
                      className="text-yellow-600"
                    >
                      <Edit size={16} />
                    </button>

                    <button
                      onClick={() => toggleActive(d.id, d.active)}
                      className="text-blue-600"
                    >
                      <Power size={16} />
                    </button>

                    <button
                      onClick={() => viewDevices(d.id)}
                      className="text-purple-600"
                    >
                      <Eye size={16} />
                    </button>
                      
                    <button
                      onClick={() => setDistributorExpiry(d.id)}
                      className="text-green-600"
                    >
                      ⏳
                    </button>

                    <button
                      onClick={() => deleteDistributor(d.id)}
                      className="text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>

                  </td>

                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* 👁️ Modal */}
      {selectedDistributor && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl w-[500px] shadow-lg">

            <h2 className="text-lg font-bold mb-4">
              Devices ({selectedDistributor.id})
            </h2>

            <div className="max-h-64 overflow-y-auto space-y-2">

              {selectedDistributor.devices.map((d: any) => {

                const activity = d.last_seen
                  ? Date.now() - d.last_seen < 2 * 60 * 1000
                    ? "🟢 Online"
                    : Date.now() - d.last_seen < 30 * 60 * 1000
                    ? "🟡 Recent"
                    : "🔴 Offline"
                  : "—";

                return (
                  <div
                    key={d.id}
                    className="border p-3 rounded text-sm"
                  >

                    {/* Device ID */}
                    <div className="font-mono text-xs text-gray-500">
                      {d.id}
                    </div>

                    {/* User */}
                    <div className="font-medium">
                      {d.user_name || "No User"}
                    </div>

                    {/* Label */}
                    <div className="text-xs text-gray-500">
                      {d.device_label || "No Label"}
                    </div>

                    {/* Activity */}
                    <div className="text-xs mt-1">
                      {activity}
                    </div>

                    {/* Expiry */}
                    <div className="text-xs text-gray-500">
                      {d.expires_at === 0 && "♾️ Lifetime"}
                      {d.expires_at > 0 &&
                        new Date(d.expires_at).toLocaleDateString()}
                      {!d.expires_at && "—"}
                    </div>

                  </div>
                );
              })}

            </div>

            <button
              onClick={() => setSelectedDistributor(null)}
              className="mt-4 bg-gray-800 text-white px-4 py-2 rounded"
            >
              Close
            </button>

          </div>
        </div>
      )}

    </div>
  );
}