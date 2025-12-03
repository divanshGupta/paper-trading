"use client";

import { useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import { UserProfile } from "@/types";

interface ProfileEditFormProps {
  profile: UserProfile;
  onSave: (updated: UserProfile) => void;
  onCancel: () => void;
}

export default function ProfileEditForm({
  profile,
  onSave,
  onCancel,
}: ProfileEditFormProps) {
  const [form, setForm] = useState({
    name: profile.name ?? "",
    phone: profile.phone ?? "",
    gender: profile.gender ?? "",
    address: profile.address ?? "",
    fatherName: profile.fatherName ?? "",
    dob: profile.dob ? profile.dob.substring(0, 10) : "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm({ ...form, [field]: value });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      // Basic validation
      if (!form.name.trim()) {
        setError("Name cannot be empty");
        setLoading(false);
        return;
      }

      if (form.phone && form.phone.length !== 10) {
        setError("Phone number must be 10 digits");
        setLoading(false);
        return;
      }

      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5500";

      const res = await fetch(`${BACKEND_URL}/api/v1/users/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const json = await res.json();

      if (res.ok) {
        onSave(json.user as UserProfile);
      } else {
        setError(json.message || "Failed to save profile.");
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-text text-xl font-semibold mb-4">Edit Profile</h2>

      {error && (
        <div className="mb-3 p-2 rounded bg-red-100 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

        <Field
          label="Full Name"
          value={form.name}
          onChange={(v) => handleChange("name", v)}
          required
          placeholder="Full Name"
        />

        <Field
          label="Phone"
          value={form.phone}
          onChange={(v) => handleChange("phone", v)}
          placeholder="10-digit number"
        />

        <div className="flex flex-col">
          <label className="text-sm font-medium mb-1">Gender</label>
          <select
            value={form.gender}
            onChange={(e) => handleChange("gender", e.target.value)}
            className="border border-border bg-bg-elevated rounded-lg px-3 py-2"
          >
            <option value="">Select</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <Field
          label="Date of Birth"
          type="date"
          value={form.dob}
          onChange={(v) => handleChange("dob", v)}
        />

        <div className="md:col-span-2">
          <Field
            label="Address"
            value={form.address}
            onChange={(v) => handleChange("address", v)}
            placeholder="Your Full Address"
          />
        </div>

        <Field
          label="Father's Name"
          value={form.fatherName}
          onChange={(v) => handleChange("fatherName", v)}
          placeholder="Your Father's Name"
        />
      </div>

      <div className="flex justify-end gap-3 mt-4">
        <button
          onClick={onCancel}
          className="px-5 py-2 rounded-lg border border-border bg-bg-surface hover:bg-bg-elevated"
        >
          Cancel
        </button>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className={`px-5 py-2 rounded-lg text-text border border-border font-semibold ${
            loading ? "bg-bg-surface" : "bg-bg-surface hover:bg-bg-elevated"
          }`}
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

/* ----------------------------------------
  REUSABLE FIELD COMPONENT
---------------------------------------- */
function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col">
      <label className="text-sm font-medium mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="border border-border rounded-lg px-3 py-2 bg-bg-elevated focus:outline-none"
      />
    </div>
  );
}
