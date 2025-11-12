"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import ProfileEditForm from "@/components/ProfileEditForm";
import Link from "next/link";

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (!token) return;

        const res = await fetch("http://localhost:5500/api/v1/users/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        setProfile(json.user);
      } catch (err) {
        console.error("Profile fetch error:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <p className="p-6">Loading profile...</p>;

  if (!profile) return <p className="p-6">No profile data found.</p>;

  if (editing) {
    return (
      <ProfileEditForm
        profile={profile}
        onSave={(updated) => {
          setProfile(updated);
          setEditing(false);
        }}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <div className="p-6 max-w-lg mx-auto space-y-3 border rounded-xl shadow">
      <h1 className="text-2xl font-bold">Your Profile</h1>
      <p><strong>Name:</strong> {profile.name || "—"}</p>
      <p><strong>Email:</strong> {profile.email}</p>
      <p><strong>Phone:</strong> {profile.phone || "—"}</p>
      <p><strong>Gender:</strong> {profile.gender || "—"}</p>
      <p><strong>Address:</strong> {profile.address || "—"}</p>
      <p><strong>DOB:</strong> {profile.dob ? new Date(profile.dob).toLocaleDateString() : "—"}</p>
      <p><strong>Father's Name:</strong> {profile.fatherName || "—"}</p>
      <p><strong>Balance:</strong> ₹{Number(profile.balance).toFixed(2)}</p>

      <button
        onClick={() => setEditing(true)}
        className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
      >
        Edit Profile
      </button>

      <Link href="/dashboard" className="text-blue-600 ml-4">Back to homepage</Link>
    </div>
  );
}
