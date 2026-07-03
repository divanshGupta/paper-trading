"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import ProfileEditForm from "@/components/profile/ProfileEditForm";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthGuard from "../../../hooks/authGaurd";
import ProfileSkeleton from "@/components/skeletons/ProfileSkeleton";
import { UserProfile } from "@/types";
import {
  LogOut,
  User,
  Phone,
  MapPin,
  Calendar,
  UserCircle,
  Wallet,
  ChevronLeft,
  Edit3,
  X,
  Mail,
  Shield,
  TrendingUp,
  Award,
} from "lucide-react";

function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL as string;
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  if (loading) return <ProfileSkeleton />;

  if (!profile)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] px-4">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--color-bg-elevated)] flex items-center justify-center">
            <User className="w-8 h-8 text-[var(--color-text-secondary)]" />
          </div>
          <p className="text-[var(--color-text)] text-lg font-medium">
            No profile data found.
          </p>
        </div>
      </div>
    );

  const initials = (
    (profile.name?.[0] ?? profile.email?.[0] ?? "?")
  ).toUpperCase();

  const memberSince = new Date().toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
  });

  return (
    <div className="min-h-screen bg-[var(--color-bg)] pb-24 md:pb-8">
      {/* Sticky Header */}
      <header
        className={`sticky top-0 z-30 transition-all duration-300 ${
          isScrolled
            ? "bg-[var(--color-bg-surface)]/80 backdrop-blur-xl shadow-sm border-b border-[var(--color-border)]"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm font-medium hidden sm:inline">Back</span>
          </Link>

          {/* <h1
            className={`text-lg font-bold transition-opacity duration-300 ${
              isScrolled ? "opacity-100" : "opacity-0"
            }`}
            style={{ color: "var(--color-text)" }}
          >
            Profile
          </h1> */}

          <button
            onClick={() => setEditing((s) => !s)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-300 hover:scale-105 active:scale-95"
            style={{
              backgroundColor: editing
                ? "var(--color-negative-soft)"
                : "var(--color-brand-light)",
              color: editing
                ? "var(--color-negative)"
                : "var(--color-brand-dark)",
            }}
          >
            {editing ? (
              <>
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Cancel</span>
              </>
            ) : (
              <>
                <Edit3 className="w-4 h-4" />
                <span className="hidden sm:inline">Edit</span>
              </>
            )}
          </button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 pt-4 sm:pt-8">
        {/* Hero Card */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl mb-6 sm:mb-8 shadow-lg shadow-[var(--color-brand-glow)]">
          {/* Background Gradient */}
          <div
            className="absolute inset-0 bg-gradient-to-br from-[var(--color-brand)] to-[var(--color-brand-dark)]"
            style={{ opacity: 0.95 }}
          />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30" />

          <div className="relative p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-6">
              {/* Avatar with Ring */}
              <div className="relative">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-2xl sm:text-3xl font-bold border-2 border-white/30 shadow-xl">
                  {initials}
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 sm:w-7 sm:h-7 bg-[var(--color-positive)] rounded-full border-2 border-white flex items-center justify-center">
                  <Shield className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
                </div>
              </div>

              {/* User Info */}
              <div className="text-center sm:text-left flex-1">
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">
                  {profile.name || "Unnamed User"}
                </h2>
                <div className="flex items-center justify-center sm:justify-start gap-2 text-white/80 text-sm">
                  <Mail className="w-3.5 h-3.5" />
                  <span>{profile.email}</span>
                </div>
                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-white text-xs font-medium">
                  <Award className="w-3.5 h-3.5" />
                  Member since {memberSince}
                </div>
              </div>

              {/* Balance Badge */}
              <div className="flex flex-col items-center sm:items-end">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl px-5 py-3 sm:px-6 sm:py-4 border border-white/20">
                  <div className="flex items-center gap-2 text-white/70 text-xs sm:text-sm font-medium mb-1">
                    <Wallet className="w-3.5 h-3.5" />
                    Balance
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                    ₹{Number(profile.balance).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-4 sm:space-y-6">
          {/* Edit Form or Details */}
          <div
            className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] shadow-sm overflow-hidden transition-all duration-500"
            style={{
              boxShadow: "0 4px 20px -4px var(--color-brand-glow)",
            }}
          >
            <div className="p-5 sm:p-6">
              <div className="flex items-center justify-between mb-5 sm:mb-6">
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{
                      backgroundColor: "var(--color-brand-light)",
                      color: "var(--color-brand-dark)",
                    }}
                  >
                    <UserCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h2
                      className="text-lg font-bold"
                      style={{ color: "var(--color-text)" }}
                    >
                      {editing ? "Edit Profile" : "Personal Information"}
                    </h2>
                    <p
                      className="text-xs sm:text-sm"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      {editing
                        ? "Update your details below"
                        : "Your account details at a glance"}
                    </p>
                  </div>
                </div>
              </div>

              {editing ? (
                <div className="animate-in slide-in-from-bottom-4 duration-300">
                  <ProfileEditForm
                    profile={profile}
                    onSave={(updated: UserProfile) => {
                      setProfile(updated);
                      setEditing(false);
                    }}
                    onCancel={() => setEditing(false)}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 animate-in fade-in duration-500">
                  <DetailCard
                    icon={<Phone className="w-4 h-4" />}
                    label="Phone Number"
                    value={profile.phone}
                    accent="var(--color-blue)"
                  />
                  <DetailCard
                    icon={<User className="w-4 h-4" />}
                    label="Gender"
                    value={profile.gender}
                    accent="var(--color-purple)"
                  />
                  <DetailCard
                    icon={<MapPin className="w-4 h-4" />}
                    label="Address"
                    value={profile.address}
                    accent="var(--color-yellow)"
                    fullWidth
                  />
                  <DetailCard
                    icon={<Calendar className="w-4 h-4" />}
                    label="Date of Birth"
                    value={
                      profile.dob
                        ? new Date(profile.dob).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : null
                    }
                    accent="var(--color-brand)"
                  />
                  <DetailCard
                    icon={<UserCircle className="w-4 h-4" />}
                    label="Father's Name"
                    value={profile.fatherName}
                    accent="var(--color-text-secondary)"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Stats / Gamification Strip */}
          {/* {!editing && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              <StatCard
                icon={<TrendingUp className="w-5 h-5" />}
                label="Portfolio"
                value="Active"
                color="var(--color-positive)"
                bgColor="var(--color-positive-soft)"
              />
              <StatCard
                icon={<Award className="w-5 h-5" />}
                label="Status"
                value="Verified"
                color="var(--color-brand)"
                bgColor="var(--color-brand-light)"
              />
              <StatCard
                icon={<Shield className="w-5 h-5" />}
                label="Security"
                value="Enabled"
                color="var(--color-blue)"
                bgColor="rgba(59, 130, 246, 0.1)"
                className="col-span-2 sm:col-span-1"
              />
            </div>
          )} */}

          {/* Logout Section */}
          <div className="pt-4 sm:pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link
              href="/dashboard"
              className="group flex items-center gap-2 text-sm font-medium transition-colors duration-300 hover:text-[var(--color-brand)]"
              style={{ color: "var(--color-text-secondary)" }}
            >
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--color-bg-elevated)] group-hover:bg-[var(--color-brand-light)] transition-colors duration-300">
                <ChevronLeft className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
              </span>
              <span className="relative">
                Back to Dashboard
                <span className="absolute left-0 -bottom-0.5 h-px w-0 bg-current transition-all duration-300 group-hover:w-full" />
              </span>
            </Link>

            <button
              onClick={() =>
                supabase.auth.signOut().then(() => router.replace("/login"))
              }
              className="group flex items-center gap-3 px-5 py-3 rounded-xl bg-[var(--color-negative-soft)] text-[var(--color-negative)] font-semibold text-sm transition-all duration-300 hover:shadow-lg hover:shadow-[var(--color-negative)]/10 hover:-translate-y-0.5 active:translate-y-0 w-full sm:w-auto justify-center sm:justify-start"
            >
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--color-negative)] text-white transition-transform duration-300 group-hover:rotate-12">
                <LogOut className="w-4 h-4" />
              </span>
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sub-components                                                     */
/* ------------------------------------------------------------------ */

function DetailCard({
  icon,
  label,
  value,
  accent,
  fullWidth = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number | null | undefined;
  accent: string;
  fullWidth?: boolean;
}) {
  return (
    <div
      className={`group relative p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] hover:bg-[var(--color-bg-elevated)] transition-all duration-300 hover:shadow-md ${
        fullWidth ? "sm:col-span-2" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110"
          style={{ backgroundColor: accent + "15", color: accent }}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p
            className="text-xs font-medium uppercase tracking-wider mb-1"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {label}
          </p>
          <p
            className="text-sm sm:text-base font-semibold truncate"
            style={{ color: "var(--color-text)" }}
          >
            {value || (
              <span
                className="italic font-normal"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Not provided
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
  bgColor,
  className = "",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  bgColor: string;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center gap-3 p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 ${className}`}
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: bgColor, color: color }}
      >
        {icon}
      </div>
      <div>
        <p
          className="text-xs font-medium"
          style={{ color: "var(--color-text-secondary)" }}
        >
          {label}
        </p>
        <p className="text-sm font-bold" style={{ color: color }}>
          {value}
        </p>
      </div>
    </div>
  );
}

const ProtectedProfilePage = () => (
  <AuthGuard>
    <ProfilePage />
  </AuthGuard>
);

export default ProtectedProfilePage;