"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import ProfileEditForm from "@/components/ProfileEditForm";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  const router = useRouter();

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

  if (loading) return (
    <div className="p-10 text-center text-gray-500">Loading your profile...</div>
  );

  if (!profile) return <p className="p-6">No profile data found.</p>;

  // Avatar initials
  const initials =
    (profile.name?.[0] ?? profile.email?.[0] ?? "?").toUpperCase();

  return (
    <div className="max-w-3xl mx-auto p-6 pb-16 pt-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Profile</h1>

        {/* Edit button toggles inline edit area */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setEditing((s) => !s)}
            className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600"
          >
            {editing ? "Close" : "Edit Profile"}
          </button>
        </div>
      </div>

      {/* Top card (avatar + basic) */}
      <div className="flex items-center gap-4 p-5 rounded-xl shadow bg-white dark:bg-gray-900 border mb-6">
        <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl font-semibold">
          {initials}
        </div>
        <div className="flex-1">
          <p className="text-xl font-semibold">{profile.name || "Unnamed User"}</p>
          <p className="text-gray-600 dark:text-gray-400">{profile.email}</p>
        </div>

        <div className="text-right">
          <p className="text-sm text-gray-500">Balance</p>
          <p className="text-lg font-bold">₹{Number(profile.balance).toFixed(2)}</p>
        </div>
      </div>

      {/* Main card: either details or edit form shown inline */}
      <div className="p-5 rounded-xl shadow bg-white dark:bg-gray-900 border mb-6">
        {editing ? (
          // Inline edit form — stays inside the card
          <ProfileEditForm
            profile={profile}
            onSave={(updated: any) => {
              setProfile(updated);
              setEditing(false);
            }}
            onCancel={() => setEditing(false)}
          />
        ) : (
          <>
            <h2 className="text-xl font-semibold mb-3">Personal Information</h2>

            <div className="grid grid-cols-2 gap-4">
              <Detail label="Phone" value={profile.phone} />
              <Detail label="Gender" value={profile.gender} />
              <Detail label="Address" value={profile.address} colSpan={2} />
              <Detail
                label="Date of Birth"
                value={profile.dob ? new Date(profile.dob).toLocaleDateString() : "—"}
              />
              <Detail label="Father's Name" value={profile.fatherName} />
            </div>
          </>
        )}
      </div>

      {/* Footer actions */}
      <div className="mt-4 flex items-center justify-between">
        <Link href="/dashboard" className="text-blue-600 font-medium">
          ← Back to dashboard
        </Link>

        <button
          className="border px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          onClick={() => supabase.auth.signOut().then(() => router.replace("/login"))}
        >
          Logout
        </button>
      </div>
    </div>
  );
}

function Detail({ label, value, colSpan = 1 }: { label: string; value: any; colSpan?: number }) {
  return (
    <div className={` flex flex-col ${colSpan === 2 ? "col-span-2" : ""} border-b pb-3`}>
      <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
      <span className="font-medium">{value || "—"}</span>
    </div>
  );
}
