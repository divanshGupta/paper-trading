"use client";

import { useState } from "react";
import { supabase } from "@/utils/supabaseClient";

interface ProfileData {
  name?: string;
  phone?: string;
  dob?: string;
  gender?: string;
  address?: string;
  fatherName?: string;
}

interface Props {
  profile: ProfileData;
  onSave: (updated: ProfileData) => void;
  onCancel: () => void;
}

export default function ProfileEditForm({ profile, onSave, onCancel }: Props) {
  const [formData, setFormData] = useState<ProfileData>(profile);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error("User not logged in");

      const res = await fetch("http://localhost:5500/api/v1/users/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to update profile");

      setMessage("✅ Profile updated successfully!");
      onSave(json.user);
    } catch (err: any) {
      console.error("Update error:", err);
      setMessage("❌ " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 bg-white text-gray-700 border rounded-xl shadow p-6 max-w-md mx-auto"
    >
      <h2 className="text-xl font-semibold mb-4">Edit Profile</h2>

      <input
        type="text"
        name="name"
        placeholder="Full Name"
        value={formData.name || ""}
        onChange={handleChange}
        className="w-full border px-3 py-2 rounded-md"
      />

      <input
        type="tel"
        name="phone"
        placeholder="Phone Number"
        value={formData.phone || ""}
        onChange={handleChange}
        className="w-full border px-3 py-2 rounded-md"
      />

      <input
        type="date"
        name="dob"
        value={formData.dob || ""}
        onChange={handleChange}
        className="w-full border px-3 py-2 rounded-md"
      />

      <select
        name="gender"
        value={formData.gender || ""}
        onChange={handleChange}
        className="w-full border px-3 py-2 rounded-md"
      >
        <option value="">Select Gender</option>
        <option value="male">Male</option>
        <option value="female">Female</option>
        <option value="other">Other</option>
      </select>

      <input
        type="text"
        name="fatherName"
        placeholder="Father's Name"
        value={formData.fatherName || ""}
        onChange={handleChange}
        className="w-full border px-3 py-2 rounded-md"
      />

      <input
      type="text"
        name="address"
        placeholder="Address"
        value={formData.address || ""}
        onChange={handleChange}
        className="w-full border px-3 py-2 rounded-md"
      />

      <div className="flex justify-between items-center">
        <button
          type="button"
          onClick={onCancel}
          className="text-gray-600 underline"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {message && <p className="text-center text-sm mt-3">{message}</p>}
    </form>
  );
}
