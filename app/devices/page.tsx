"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";

import {
  Trash2,
  Plus,
  Search,
  Zap,
  Calendar,
  Link,
  User,
} from "lucide-react";

import { deleteField } from "firebase/firestore";

export default function Home() {
  const [devices, setDevices] = useState<any[]>([]);
  const [newDeviceId, setNewDeviceId] = useState("");
  const [search, setSearch] = useState("");

  const [selectedDevice, setSelectedDevice] = useState<any>(null);
  const [userName, setUserName] = useState("");
  const [deviceLabel, setDeviceLabel] = useState("");

  const [distributors, setDistributors] = useState<any[]>([]);
  const [selectedDistributorDevice, setSelectedDistributorDevice] = useState<any>(null);

  // ===============================
  // 🔄 Fetch Devices
  // ===============================
  const fetchDevices = async () => {
    const deviceSnap = await getDocs(collection(db, "licensed_devices"));
    const distSnap = await getDocs(collection(db, "distributors"));

const deviceList: any[] = [];
deviceSnap.forEach((docSnap) => {
  deviceList.push({ id: docSnap.id, ...docSnap.data() });
});

const distList: any[] = [];
distSnap.forEach((d) => {
  const data = d.data();

  const count = deviceList.filter(
    (dev) => dev.distributor_id === d.id
  ).length;

  distList.push({
    id: d.id,
    ...data,
    device_count: count,
  });
});

setDistributors(distList);

  const distributorMap: any = {};
  distList.forEach((d) => {
    distributorMap[d.id] = d;
  });

  const list = deviceList.map((d) => {
    const distributor = distributorMap[d.distributor_id];

    return {
      ...d,
      distributor_active: distributor?.active ?? true,
      distributor_name: distributor?.name || "—",
    };
  });

    setDevices(list);
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  // ===============================
  // Actions
  // ===============================
  const togglePro = async (deviceId: string, current: boolean) => {
    await updateDoc(doc(db, "licensed_devices", deviceId), {
      pro_override: !current,
    });
    fetchDevices();
  };

  const addDevice = async () => {
    if (!newDeviceId) return;

    await setDoc(doc(db, "licensed_devices", newDeviceId), {
      user_name: "",
      device_label: "",
      last_seen: 0,
      pro_override: true,
      expires_at: 0,
      active: true,
      created_at: Date.now(),
    });

    setNewDeviceId("");
    fetchDevices();
  };

  const deleteDevice = async (deviceId: string) => {
    if (!confirm("Delete this device?")) return;

    await deleteDoc(doc(db, "licensed_devices", deviceId));
    fetchDevices();
  };

  // ✅ FIXED EXPIRY FUNCTION
  const setExpiry = async (deviceId: string) => {
    const input = prompt(
      "Enter days OR type 'lifetime':\n\nExamples:\n30 = 30 days\n0 = remove expiry\nlifetime = forever"
    );

    if (!input) return;

    let expiry = 0;

    if (input.toLowerCase() === "lifetime") {
      expiry = 0;
    } else if (!isNaN(Number(input))) {
      const days = Number(input);

      if (days === 0) {
        expiry = 0;
      } else {
        expiry =
          Date.now() + days * 24 * 60 * 60 * 1000;
      }
    } else {
      alert("Invalid input");
      return;
    }

    await updateDoc(doc(db, "licensed_devices", deviceId), {
      expires_at: expiry,
    });

    fetchDevices();
  };

  const assignDistributor = async (deviceId: string, distributor: any) => {
    // Allow if already assigned to same distributor
    if (
      distributor.device_count >= (distributor.max_devices || 0) &&
      selectedDistributorDevice?.distributor_id !== distributor.id
    ) {
      alert("❌ Limit reached for this distributor");
      return;
    }

    await updateDoc(doc(db, "licensed_devices", deviceId), {
      distributor_id: distributor.id,
    });

    setSelectedDistributorDevice(null);
    fetchDevices();
  };

  const removeDistributor = async (deviceId: string) => {
    await updateDoc(doc(db, "licensed_devices", deviceId), {
      distributor_id: deleteField(),
    });

    setSelectedDistributorDevice(null);
    fetchDevices();
  };

  // ===============================
  // 👤 User Modal
  // ===============================
  const openUserModal = (device: any) => {
    setSelectedDevice(device);
    setUserName(device.user_name || "");
    setDeviceLabel(device.device_label || "");
  };

  const saveUser = async () => {
    await updateDoc(doc(db, "licensed_devices", selectedDevice.id), {
      user_name: userName,
      device_label: deviceLabel,
    });

    setSelectedDevice(null);
    fetchDevices();
  };

  // ===============================
  // 🟢 Activity Status
  // ===============================
  const getActivityStatus = (lastSeen: number) => {
    if (!lastSeen) return "—";

    const diff = Date.now() - lastSeen;

    if (diff < 2 * 60 * 1000) return "online";
    if (diff < 30 * 60 * 1000) return "recent";

    return "offline";
  };

  // ===============================
  // UI
  // ===============================
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Devices</h1>

      {/* Top Controls */}
      <div className="flex gap-3 mb-4">
        <div className="flex items-center border rounded px-2">
          <Search size={16} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="p-2 outline-none"
          />
        </div>

        <input
          value={newDeviceId}
          onChange={(e) => setNewDeviceId(e.target.value)}
          placeholder="Device ID"
          className="border p-2 rounded"
        />

        <button
          onClick={addDevice}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          <span className="flex items-center gap-2">
            <Plus size={16} />
            Add
          </span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Device</th>
              <th className="p-3">Distributor</th>
              <th className="p-3">User</th>
              <th className="p-3">Label</th>
              <th className="p-3">Activity</th>
              <th className="p-3">Last Seen</th>
              <th className="p-3">Status</th>
              <th className="p-3">Expiry</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {devices
              .filter((d) =>
                d.id.toLowerCase().includes(search.toLowerCase())
              )
              .map((d) => {
                const isActive =
                  d.pro_override &&
                  d.distributor_active !== false;

                const activity = getActivityStatus(d.last_seen);

                return (
                  <tr key={d.id} className="border-t hover:bg-gray-50">

                    <td className="p-3 font-mono">{d.id}</td>
                    <td className="p-3 text-xs">
                      <div>{d.distributor_name || "—"}</div>
                      <div className="text-gray-400">{d.distributor_id || ""}</div>
                    </td>
                    <td className="p-3">{d.user_name || "—"}</td>
                    <td className="p-3">{d.device_label || "—"}</td>
                  
                    {/* Activity */}
                    <td className="p-3">
                      {activity === "online" && (
                        <span className="text-green-600">🟢 Online</span>
                      )}
                      {activity === "recent" && (
                        <span className="text-yellow-600">🟡 Recent</span>
                      )}
                      {activity === "offline" && (
                        <span className="text-red-600">🔴 Offline</span>
                      )}
                      {activity === "—" && "—"}
                    </td>

                    {/* Last Seen */}
                    <td className="p-3 text-xs text-gray-500">
                      {d.last_seen
                        ? new Date(d.last_seen).toLocaleString()
                        : "—"}
                    </td>

                    {/* Status */}
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {isActive ? "Active" : "Disabled"}
                      </span>
                    </td>

                    {/* Expiry */}
                    <td className="p-3">
                      {d.expires_at === 0 && "♾️ Lifetime"}
                      {d.expires_at > 0 &&
                        new Date(d.expires_at).toLocaleDateString()}
                      {!d.expires_at && "—"}
                    </td>

                    {/* Actions */}
                    <td className="p-3 flex gap-2">
                      <button
                        onClick={() => openUserModal(d)}
                        className="text-gray-600"
                      >
                        <User size={16} />
                      </button>

                      <button
                        onClick={() =>
                          togglePro(d.id, d.pro_override)
                        }
                        className="text-blue-600"
                      >
                        <Zap size={16} />
                      </button>

                      <button
                        onClick={() => setExpiry(d.id)}
                        className="text-yellow-600"
                      >
                        <Calendar size={16} />
                      </button>

                      <button
                        onClick={() => setSelectedDistributorDevice(d)}
                        className="text-purple-600"
                      >
                        <Link size={16} />
                      </button>

                      <button
                        onClick={() => deleteDevice(d.id)}
                        className="text-red-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {/* ===============================
          👤 USER MODAL
      =============================== */}
      {selectedDevice && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl w-[400px]">
            <h2 className="text-lg font-bold mb-4">Edit User</h2>

            <input
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="User Name"
              className="border p-2 rounded w-full mb-3"
            />

            <input
              value={deviceLabel}
              onChange={(e) => setDeviceLabel(e.target.value)}
              placeholder="Device Label"
              className="border p-2 rounded w-full mb-3"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setSelectedDevice(null)}
                className="px-3 py-2 bg-gray-400 text-white rounded"
              >
                Cancel
              </button>

              <button
                onClick={saveUser}
                className="px-3 py-2 bg-green-600 text-white rounded"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===============================
          🔗 DISTRIBUTOR MODAL
      =============================== */}
      {selectedDistributorDevice && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl w-[400px]">

            <h2 className="text-lg font-bold mb-4">
              Select Distributor
            </h2>

            <button
              onClick={() => removeDistributor(selectedDistributorDevice.id)}
              className="w-full mb-3 bg-red-600 text-white p-2 rounded"
            >
              Remove Distributor
            </button>

            <div className="max-h-60 overflow-y-auto space-y-2">

              {distributors.map((dist) => {
                const isFull =
                  dist.device_count >= (dist.max_devices || 0);

                const isCurrent =
                  selectedDistributorDevice.distributor_id === dist.id;

                return (
                  <button
                    key={dist.id}
                    onClick={() =>
                      assignDistributor(selectedDistributorDevice.id, dist)
                    }
                    disabled={isFull && !isCurrent}
                    className={`w-full text-left border p-3 rounded ${
                      isFull && !isCurrent
                        ? "bg-gray-100 text-gray-400"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    <div className="font-medium flex justify-between">
                      {dist.name}
                      {isCurrent && (
                        <span className="text-xs text-blue-600">
                          Current
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-gray-500">
                      {dist.device_count} / {dist.max_devices}
                    </div>

                    {isFull && !isCurrent && (
                      <div className="text-xs text-red-500">
                        Limit reached
                      </div>
                    )}
                  </button>
                );
              })}

            </div>

            <button
              onClick={() => setSelectedDistributorDevice(null)}
              className="mt-4 bg-gray-800 text-white px-4 py-2 rounded w-full"
            >
              Cancel
            </button>

          </div>
        </div>
      )}

    </div>
  );
}