import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { AuthButton } from "../auth/AuthButton";
import { Smartphone, Monitor, ShieldAlert } from "lucide-react";

interface SettingsViewProps {
  showToast: (msg: string) => void;
}

interface ToggleProps {
  checked: boolean;
  onChange: (val: boolean) => void;
  label: string;
  description?: string;
}

const Toggle: React.FC<ToggleProps> = ({ checked, onChange, label, description }) => {
  return (
    <div className="flex items-start justify-between w-full gap-6 py-1">
      <div className="space-y-1 flex-grow">
        <span className="block text-xs font-display tracking-wider text-[#F7F5EE]/80 uppercase">{label}</span>
        {description && <span className="block text-[10px] font-body text-[#F7F5EE]/40 leading-normal">{description}</span>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5.5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none focus:ring-1 focus:ring-[#C9A227] focus:ring-offset-1 focus:ring-offset-[#0D1626] ${
          checked ? "bg-[#C9A227]" : "bg-white/10"
        }`}
        role="switch"
        aria-checked={checked}
      >
        <span
          className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-[#0D1626] border border-white/5 shadow-md transition duration-300 ease-in-out ${
            checked ? "translate-x-4.5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
};

export const SettingsView: React.FC<SettingsViewProps> = ({ showToast }) => {
  const { logout } = useAuth();
  const [saving, setSaving] = useState(false);

  // Settings State
  const [font, setFont] = useState("serif");
  const [width, setWidth] = useState("comfortable");
  const [zoom, setZoom] = useState("100%");
  const [lineHeight, setLineHeight] = useState("comfortable");

  // Notifications Toggles
  const [emailNotif, setEmailNotif] = useState(true);
  const [readingReminders, setReadingReminders] = useState(true);
  const [borrowReminders, setBorrowReminders] = useState(false);
  const [productUpdates, setProductUpdates] = useState(false);

  // Privacy Toggles
  const [profileVisible, setProfileVisible] = useState(false);
  const [activityVisible, setActivityVisible] = useState(true);
  const [journalPrivate, setJournalPrivate] = useState(true);

  // Load preferences from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("avelis_settings");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.font) setFont(parsed.font);
        if (parsed.width) setWidth(parsed.width);
        if (parsed.zoom) setZoom(parsed.zoom);
        if (parsed.lineHeight) setLineHeight(parsed.lineHeight);

        if (parsed.emailNotif !== undefined) setEmailNotif(parsed.emailNotif);
        if (parsed.readingReminders !== undefined) setReadingReminders(parsed.readingReminders);
        if (parsed.borrowReminders !== undefined) setBorrowReminders(parsed.borrowReminders);
        if (parsed.productUpdates !== undefined) setProductUpdates(parsed.productUpdates);

        if (parsed.profileVisible !== undefined) setProfileVisible(parsed.profileVisible);
        if (parsed.activityVisible !== undefined) setActivityVisible(parsed.activityVisible);
        if (parsed.journalPrivate !== undefined) setJournalPrivate(parsed.journalPrivate);
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const settings = {
        font,
        width,
        zoom,
        lineHeight,
        emailNotif,
        readingReminders,
        borrowReminders,
        productUpdates,
        profileVisible,
        activityVisible,
        journalPrivate,
      };
      localStorage.setItem("avelis_settings", JSON.stringify(settings));
      showToast("Preferences updated successfully.");
    } catch (err) {
      showToast("Failed to save preferences.");
    } finally {
      setSaving(false);
    }
  };

  const handleSignOutEverywhere = () => {
    logout();
  };

  return (
    <div className="space-y-12">
      {/* Hero Header */}
      <div className="border-b border-[rgba(201,162,39,0.1)] pb-8">
        <h2 className="font-display text-4xl sm:text-5xl tracking-[0.02em] leading-tight text-[#F7F5EE]">
          Settings
        </h2>
        <p className="font-body text-xs text-[#F7F5EE]/60 mt-2">
          Personalize your AVELIS experience.
        </p>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Preferences */}
        <div className="lg:col-span-7 space-y-8">
          {/* Appearance Section */}
          <div className="bg-[#0D1626]/40 border border-[rgba(201,162,39,0.12)] rounded-lg p-6 sm:p-8 space-y-6 shadow-[0_15px_35px_rgba(0,0,0,0.2)]">
            <span className="block font-display text-sm tracking-[0.15em] text-[#F7F5EE] uppercase border-b border-[rgba(201,162,39,0.1)] pb-3">
              Appearance & Feel
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label htmlFor="theme" className="font-display text-[9px] tracking-[0.2em] uppercase text-[#F7F5EE]/70 select-none">
                  Application Theme
                </label>
                <select
                  id="theme"
                  disabled
                  value="dark"
                  className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(201,162,39,0.18)] rounded px-4 py-3 text-[#F7F5EE]/50 font-body text-xs focus:outline-none opacity-60 cursor-not-allowed"
                >
                  <option value="dark">Dark Sanctum</option>
                  <option value="light" disabled>Light (Disabled)</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-display text-[9px] tracking-[0.2em] uppercase text-[#F7F5EE]/70 select-none">
                  Accent Shade
                </label>
                <div className="flex items-center gap-3 h-11 px-4 bg-[rgba(255,255,255,0.02)] border border-[rgba(201,162,39,0.1)] rounded opacity-80">
                  <div className="w-4.5 h-4.5 rounded-full bg-[#C9A227] shadow-[0_0_10px_rgba(201,162,39,0.4)]" />
                  <span className="font-display text-[10px] tracking-wider text-[#C9A227] uppercase">Aureolin Gold</span>
                </div>
              </div>
            </div>
          </div>

          {/* Reading Preferences Section */}
          <div className="bg-[#0D1626]/40 border border-[rgba(201,162,39,0.12)] rounded-lg p-6 sm:p-8 space-y-6 shadow-[0_15px_35px_rgba(0,0,0,0.2)]">
            <span className="block font-display text-sm tracking-[0.15em] text-[#F7F5EE] uppercase border-b border-[rgba(201,162,39,0.1)] pb-3">
              Reading Typography
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label htmlFor="font-family" className="font-display text-[9px] tracking-[0.2em] uppercase text-[#F7F5EE]/70 select-none">
                  Reading Font
                </label>
                <select
                  id="font-family"
                  value={font}
                  onChange={(e) => setFont(e.target.value)}
                  disabled={saving}
                  className="w-full bg-[#07111F] border border-[rgba(201,162,39,0.18)] rounded px-4 py-3 text-[#F7F5EE] font-body text-xs focus:outline-none focus:ring-1 focus:ring-[#C9A227] focus:border-[#C9A227] transition-all cursor-pointer"
                >
                  <option value="serif">Editorial Serif (Baskerville / Cinzel)</option>
                  <option value="sans-serif">Modern Sans (Inter / Roboto)</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="reading-width" className="font-display text-[9px] tracking-[0.2em] uppercase text-[#F7F5EE]/70 select-none">
                  Text Column Width
                </label>
                <select
                  id="reading-width"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  disabled={saving}
                  className="w-full bg-[#07111F] border border-[rgba(201,162,39,0.18)] rounded px-4 py-3 text-[#F7F5EE] font-body text-xs focus:outline-none focus:ring-1 focus:ring-[#C9A227] focus:border-[#C9A227] transition-all cursor-pointer"
                >
                  <option value="comfortable">Comfortable (Standard Column)</option>
                  <option value="compact">Compact (Narrow Column)</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="font-zoom" className="font-display text-[9px] tracking-[0.2em] uppercase text-[#F7F5EE]/70 select-none">
                  Text Zoom
                </label>
                <select
                  id="font-zoom"
                  value={zoom}
                  onChange={(e) => setZoom(e.target.value)}
                  disabled={saving}
                  className="w-full bg-[#07111F] border border-[rgba(201,162,39,0.18)] rounded px-4 py-3 text-[#F7F5EE] font-body text-xs focus:outline-none focus:ring-1 focus:ring-[#C9A227] focus:border-[#C9A227] transition-all cursor-pointer"
                >
                  <option value="100%">100% (Default)</option>
                  <option value="110%">110% (Magnified)</option>
                  <option value="120%">120% (Large)</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="line-height" className="font-display text-[9px] tracking-[0.2em] uppercase text-[#F7F5EE]/70 select-none">
                  Line Height
                </label>
                <select
                  id="line-height"
                  value={lineHeight}
                  onChange={(e) => setLineHeight(e.target.value)}
                  disabled={saving}
                  className="w-full bg-[#07111F] border border-[rgba(201,162,39,0.18)] rounded px-4 py-3 text-[#F7F5EE] font-body text-xs focus:outline-none focus:ring-1 focus:ring-[#C9A227] focus:border-[#C9A227] transition-all cursor-pointer"
                >
                  <option value="comfortable">Comfortable (Relaxed spacing)</option>
                  <option value="standard">Standard (Compact spacing)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Toggles & Security */}
        <div className="lg:col-span-5 space-y-8">
          {/* Notifications Section */}
          <div className="bg-[#0D1626]/40 border border-[rgba(201,162,39,0.12)] rounded-lg p-6 sm:p-8 space-y-6 shadow-[0_15px_35px_rgba(0,0,0,0.2)]">
            <span className="block font-display text-sm tracking-[0.15em] text-[#F7F5EE] uppercase border-b border-[rgba(201,162,39,0.1)] pb-3">
              Notifications
            </span>

            <div className="space-y-4">
              <Toggle
                checked={emailNotif}
                onChange={setEmailNotif}
                label="Email Correspondence"
                description="Receive quarterly journals and review digests."
              />
              <div className="h-[1px] bg-[rgba(201,162,39,0.08)]" />
              <Toggle
                checked={readingReminders}
                onChange={setReadingReminders}
                label="Reading Reminders"
                description="Be notified to continue your active manuscripts."
              />
              <div className="h-[1px] bg-[rgba(201,162,39,0.08)]" />
              <Toggle
                checked={borrowReminders}
                onChange={setBorrowReminders}
                label="Borrow Reminders"
                description="Alerts for digital commission deadlines."
              />
              <div className="h-[1px] bg-[rgba(201,162,39,0.08)]" />
              <Toggle
                checked={productUpdates}
                onChange={setProductUpdates}
                label="Exhibits & Commissions"
                description="Announcements of rare physical hardcovers."
              />
            </div>
          </div>

          {/* Privacy Section */}
          <div className="bg-[#0D1626]/40 border border-[rgba(201,162,39,0.12)] rounded-lg p-6 sm:p-8 space-y-6 shadow-[0_15px_35px_rgba(0,0,0,0.2)]">
            <span className="block font-display text-sm tracking-[0.15em] text-[#F7F5EE] uppercase border-b border-[rgba(201,162,39,0.1)] pb-3">
              Privacy Settings
            </span>

            <div className="space-y-4">
              <Toggle
                checked={profileVisible}
                onChange={setProfileVisible}
                label="Public Identity"
                description="Allow other members to find your archival profile."
              />
              <div className="h-[1px] bg-[rgba(201,162,39,0.08)]" />
              <Toggle
                checked={activityVisible}
                onChange={setActivityVisible}
                label="Publish Reading Log"
                description="Display your current reads to the collective."
              />
              <div className="h-[1px] bg-[rgba(201,162,39,0.08)]" />
              <Toggle
                checked={journalPrivate}
                onChange={setJournalPrivate}
                label="Immutable Journal Privacy"
                description="Set your reflections to private by default."
              />
            </div>
          </div>

          {/* Session Security Section */}
          <div className="bg-[#0D1626]/40 border border-[rgba(201,162,39,0.12)] rounded-lg p-6 sm:p-8 space-y-6 shadow-[0_15px_35px_rgba(0,0,0,0.2)]">
            <span className="block font-display text-sm tracking-[0.15em] text-[#F7F5EE] uppercase border-b border-[rgba(201,162,39,0.1)] pb-3 font-semibold text-red-400">
              Session Management
            </span>

            <div className="space-y-4 text-xs">
              <div className="flex items-center gap-3">
                <Monitor className="w-4 h-4 text-[#C9A227] opacity-60" />
                <div>
                  <span className="block text-[#F7F5EE]/80">Desktop Browser (Chrome / Windows)</span>
                  <span className="text-[10px] text-emerald-400">Current Session</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Smartphone className="w-4 h-4 text-[#F7F5EE]/40" />
                <div>
                  <span className="block text-[#F7F5EE]/60">Mobile Device (Safari / iPhone)</span>
                  <span className="text-[10px] text-[#F7F5EE]/40">Last active 2 days ago</span>
                </div>
              </div>

              <div className="h-[1px] bg-[rgba(201,162,39,0.08)]" />

              <button
                type="button"
                onClick={handleSignOutEverywhere}
                className="w-full flex items-center justify-center gap-2 border border-red-500/20 hover:border-red-500/50 text-red-400 hover:text-red-300 py-3 rounded font-display text-[9px] tracking-[0.15em] uppercase transition-all duration-300 bg-red-950/5 hover:bg-red-950/10 cursor-pointer"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Sign Out Everywhere</span>
              </button>
            </div>
          </div>
        </div>

        {/* Save Preferences Button */}
        <div className="lg:col-span-12 pt-6 border-t border-[rgba(201,162,39,0.1)] flex justify-end">
          <AuthButton
            type="submit"
            loading={saving}
            disabled={saving}
            className="w-full sm:w-auto sm:px-10"
          >
            Save Preferences
          </AuthButton>
        </div>
      </form>
    </div>
  );
};
