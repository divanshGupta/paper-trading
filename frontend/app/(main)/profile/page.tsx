"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import ProfileEditForm from "@/components/profile/ProfileEditForm";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthGuard from "../../../hooks/authGaurd";
import ProfileSkeleton from "@/components/skeletons/ProfileSkeleton";
import { UserProfile } from "@/types";

function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  // Freeze env var so ESLint does not warn about dependencies
  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL as string;

  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;

        if (!token) {
          if (mounted) setLoading(false);
          return;
        }

        const res = await fetch(`${BACKEND_URL}/api/v1/users/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const json = await res.json();

        if (mounted) {
          setProfile(json.user);
        }
      } catch (err) {
        console.error("Profile fetch error:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 
  // We intentionally do NOT include BACKEND_URL or router
  // This effect should run only once on mount.

  if (loading) return <ProfileSkeleton />;

  if (!profile)
    return (
      <div className="w-screen h-screen flex items-center justify-center">
        No profile data found.
      </div>
    );

  // Avatar initials
  const initials =
    (profile.name?.[0] ?? profile.email?.[0] ?? "?").toUpperCase();

  return (
    <div className="max-w-3xl mx-auto p-6 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Profile</h1>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setEditing((s) => !s)}
            className="px-4 py-2 rounded-lg bg-bg-main hover:bg-bg-elevated text-text border border-border"
          >
            {editing ? "Close" : "Edit Profile"}
          </button>
        </div>
      </div>

      {/* Top card */}
      <div className="flex items-center gap-4 p-5 rounded-xl shadow bg-bg-surface border border-border mb-6">
        <div className="hidden w-16 h-16 rounded-full bg-bg-elevated text-text md:flex items-center justify-center text-2xl font-semibold">
          {initials}
        </div>

        <div className="flex-1">
          <p className="text-text text-xl font-semibold">
            {profile.name || "Unnamed User"}
          </p>
          <p className="text-text-secondary">{profile.email}</p>
        </div>

        <div className="text-right">
          <p className="text-sm text-text-secondary">Balance</p>
          <p className="text-lg font-bold text-text">
            ₹{Number(profile.balance).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Main card */}
      <div className="p-5 rounded-xl shadow bg-bg-surface border border-border mb-6">
        {editing ? (
          <ProfileEditForm
            profile={profile}
            onSave={(updated: UserProfile) => {
              setProfile(updated);
              setEditing(false);
            }}
            onCancel={() => setEditing(false)}
          />
        ) : (
          <>
            <h2 className="text-xl font-semibold mb-3 text-text-secondary">
              Personal Information
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <Detail label="Phone" value={profile.phone} />
              <Detail label="Gender" value={profile.gender} />
              <Detail label="Address" value={profile.address} colSpan={2} />
              <Detail
                label="Date of Birth"
                value={
                  profile.dob
                    ? new Date(profile.dob).toLocaleDateString()
                    : "—"
                }
              />
              <Detail label="Father's Name" value={profile.fatherName} />
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between">
        <Link href="/dashboard" className="text-text-secondary font-medium">
          ← Back to dashboard
        </Link>

        <button
          className="px-4 py-2 rounded-lg hover:bg-bg-elevated border border-border"
          onClick={() =>
            supabase.auth.signOut().then(() => router.replace("/login"))
          }
        >
          Logout
        </button>
      </div>
    </div>
  );
}

function Detail({
  label,
  value,
  colSpan = 1,
}: {
  label: string;
  value: string | number | null | undefined;
  colSpan?: number;
}) {
  return (
    <div
      className={`flex flex-col ${
        colSpan === 2 ? "col-span-2" : ""
      } border-b pb-3`}
    >
      <span className="text-sm text-text-secondary">
        {label}
      </span>
      <span className="font-medium">{value || "—"}</span>
    </div>
  );
}

const ProtectedProfilePage = () => (
  <AuthGuard>
    <ProfilePage />
  </AuthGuard>
);

export default ProtectedProfilePage;
