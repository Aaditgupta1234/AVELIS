import React, { useState, useRef } from "react";
import { useAuth } from "../../hooks/useAuth";
import { AuthInput } from "../auth/AuthInput";
import { AuthButton } from "../auth/AuthButton";
import { Shield, Calendar, Key, Check } from "lucide-react";

interface ProfileViewProps {
  showToast: (msg: string) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ showToast }) => {
  const { user, updateProfile, updateAvatar, resetAvatar } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(user?.name || "");
  const [bio, setBio] = useState(user?.biography || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Limit file size to 2MB
    if (file.size > 2 * 1024 * 1024) {
      setError("Avatar image must be less than 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        updateAvatar(reader.result);
        showToast("Avatar updated successfully.");
        setError("");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveClick = () => {
    resetAvatar();
    showToast("Avatar reset to default.");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Display name cannot be empty");
      return;
    }

    setSaving(true);
    setError("");

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await updateProfile(name, bio);
      showToast("Profile updated successfully.");
    } catch (err) {
      setError("Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-12">
      {/* Hero Header */}
      <div className="border-b border-[rgba(201,162,39,0.1)] pb-8">
        <h2 className="font-display text-4xl sm:text-5xl tracking-[0.02em] leading-tight text-[#F7F5EE]">
          Profile
        </h2>
        <p className="font-body text-xs text-[#F7F5EE]/60 mt-2">
          Manage your identity within the AVELIS Archive.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-950/40 border border-red-500/30 text-red-400 text-xs rounded font-body" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Column: Avatar & Account Metadata */}
        <div className="lg:col-span-4 flex flex-col items-center lg:items-start gap-8">
          {/* Avatar Area */}
          <div className="flex flex-col items-center gap-4 bg-[#0D1626]/30 border border-[rgba(201,162,39,0.12)] rounded-lg p-6 w-full shadow-[0_10px_25px_rgba(0,0,0,0.2)]">
            <span className="font-display text-[9px] tracking-[0.2em] text-[#C9A227] uppercase">
              Avatar Image
            </span>
            
            <div className="relative group">
              <div className="w-24 h-24 rounded-full overflow-hidden border border-[#C9A227]/30 shadow-[0_0_20px_rgba(201,162,39,0.1)] transition-colors group-hover:border-[#C9A227] bg-[#07111F] flex items-center justify-center">
                <img
                  src={user?.avatar}
                  alt={user?.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="flex gap-3 w-full mt-2">
              <button
                type="button"
                onClick={handleUploadClick}
                className="flex-grow bg-[#C9A227]/10 hover:bg-[#C9A227]/20 border border-[#C9A227]/30 hover:border-[#C9A227] text-[#C9A227] py-2 px-3 rounded font-display text-[9px] tracking-[0.1em] uppercase transition-all duration-300 cursor-pointer text-center"
              >
                Upload
              </button>
              <button
                type="button"
                onClick={handleRemoveClick}
                className="flex-grow bg-red-950/10 hover:bg-red-950/20 border border-red-500/20 hover:border-red-500/50 text-red-400 py-2 px-3 rounded font-display text-[9px] tracking-[0.1em] uppercase transition-all duration-300 cursor-pointer text-center"
              >
                Remove
              </button>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            <span className="text-[9px] font-body text-[#F7F5EE]/40 text-center">
              PNG, JPG up to 2MB.
            </span>
          </div>

          {/* Account Metadata Cards */}
          <div className="bg-[#0D1626]/20 border border-[rgba(201,162,39,0.08)] rounded-lg p-6 w-full space-y-5">
            <span className="block font-display text-[9px] tracking-[0.2em] text-[#F7F5EE]/40 uppercase border-b border-[rgba(201,162,39,0.08)] pb-2">
              Archive Details
            </span>

            <div className="flex items-center gap-3 text-xs">
              <Calendar className="w-4 h-4 text-[#C9A227] opacity-60" />
              <div className="space-y-0.5">
                <span className="block text-[9px] text-[#F7F5EE]/40 font-display tracking-wider uppercase">Member Since</span>
                <span className="font-body text-[#F7F5EE]/80">{user?.memberSince || "June 2026"}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <Shield className="w-4 h-4 text-[#C9A227] opacity-60" />
              <div className="space-y-0.5">
                <span className="block text-[9px] text-[#F7F5EE]/40 font-display tracking-wider uppercase">Authentication</span>
                <span className="font-body text-[#F7F5EE]/80 capitalize">{user?.provider} Account</span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <Key className="w-4 h-4 text-[#C9A227] opacity-60" />
              <div className="space-y-0.5">
                <span className="block text-[9px] text-[#F7F5EE]/40 font-display tracking-wider uppercase">Current Session</span>
                <span className="font-body text-emerald-400 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Active
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Profile Form Fields */}
        <div className="lg:col-span-8 bg-[#0D1626]/40 border border-[rgba(201,162,39,0.12)] rounded-lg p-8 space-y-6 shadow-[0_15px_35px_rgba(0,0,0,0.2)]">
          <span className="block font-display text-sm tracking-[0.15em] text-[#F7F5EE] uppercase border-b border-[rgba(201,162,39,0.1)] pb-3">
            Personal Information
          </span>

          <AuthInput
            id="display-name"
            label="Display Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={saving}
            placeholder="Your name"
          />

          <AuthInput
            id="email-address"
            label="Email Address (Read Only)"
            type="email"
            value={user?.email || ""}
            disabled
            className="opacity-60 cursor-not-allowed bg-black/10"
          />

          <AuthInput
            id="user-role"
            label="Archive Role (Read Only)"
            type="text"
            value={user?.role === "admin" ? "Administrator" : "Member"}
            disabled
            className="opacity-60 cursor-not-allowed bg-black/10 capitalize"
          />

          {/* Biography Area */}
          <div className="flex flex-col gap-2 w-full">
            <label htmlFor="bio" className="font-display text-[10px] tracking-[0.2em] uppercase text-[#F7F5EE]/70 select-none">
              Biography
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 250))}
              disabled={saving}
              rows={4}
              maxLength={250}
              placeholder="Tell the circle about your literary interests..."
              className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(201,162,39,0.18)] rounded px-4 py-3 text-[#F7F5EE] placeholder:text-[#F7F5EE]/30 font-body text-sm focus:outline-none focus:ring-1 focus:ring-[#C9A227] focus:border-[#C9A227] transition-all duration-300 resize-none"
            />
            <div className="flex justify-end">
              <span className="text-[10px] font-body text-[#F7F5EE]/40">
                {bio.length}/250 characters
              </span>
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-4 border-t border-[rgba(201,162,39,0.1)] flex justify-end">
            <AuthButton
              type="submit"
              loading={saving}
              disabled={saving}
              className="w-full sm:w-auto sm:px-10"
            >
              Save Profile
            </AuthButton>
          </div>
        </div>
      </form>
    </div>
  );
};
