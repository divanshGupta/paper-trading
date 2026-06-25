"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import ProfileEditForm from "@/components/profile/ProfileEditForm";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthGuard from "../../../hooks/authGaurd";
import ProfileSkeleton from "@/components/skeletons/ProfileSkeleton";
import { UserProfile } from "@/types";
import { LogOut } from "lucide-react";

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
            className="bg-bg-elevated px-4 py-2 rounded-lg hover:bg-opacity-40 text-text border border-border"
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
        <Link
        href="/dashboard"
        className="group inline-flex items-center gap-2 text-text-secondary font-medium transition-colors duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:text-text-primary"
      >
        <span className="transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-x-1">
          ←
        </span>
        <span className="relative">
          Back to dashboard
          <span className="absolute left-0 -bottom-0.5 h-px w-0 bg-current transition-[width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:w-full" />
        </span>
      </Link>

        {/* <button
          className="bg-bg-elevated text-center w-40 rounded-2xl h-14 relative text-white text-md font-semibold group"
          type="button"
          
        >
          <div
            className="bg-negative rounded-xl h-12 w-1/4 flex items-center justify-center absolute left-1 top-[4px] group-hover:w-full z-10 duration-500"
          >
            <LogOut />
          </div>
          <p className="translate-x-2">Logout</p>
        </button> */}


        <button
          onClick={() => supabase.auth.signOut().then(() => router.replace("/login"))}
          className="group flex h-11 w-11 items-center gap-2 overflow-hidden rounded-full bg-negative px-3 text-white shadow-lg transition-[width,border-radius,box-shadow,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:w-32 hover:rounded-lg active:translate-y-px"
        >
          <span className="flex h-5 w-5 shrink-0 items-center justify-center">
            <LogOut />
          </span>

          <span
            className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 translate-x-2 transition-[max-width,opacity,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:max-w-[80px] group-hover:translate-x-0 group-hover:opacity-100"
          >
            Logout
          </span>
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
