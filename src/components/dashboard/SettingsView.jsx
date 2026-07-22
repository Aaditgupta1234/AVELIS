import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { AuthButton } from "../auth/AuthButton";
import { Smartphone, Monitor, ShieldAlert, CheckCircle, User, Mail, Shield } from "lucide-react";

const Toggle = ({ checked, onChange, label, description }) => {
  return (
    <div className="flex items-start justify-between w-full gap-6 py-1">
      <div className="space-y-1 flex-grow">
        <span className="block text-xs font-display tracking-wider text-[#F7F5EE]/80 uppercase">
          {label}
        </span>
        {description && (
          <span className="block text-[10px] font-body text-[#F7F5EE]/40 leading-normal">
            {description}
          </span>
        )}
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

export const SettingsView = ({ showToast }) => {
  const { user, logout } = useAuth();
  const [saving, setSaving] = useState(false);

  // Detect real current browser and OS dynamically
  const [currentSessionInfo, setCurrentSessionInfo] = useState({
    device: "Desktop Browser",
    os: "Windows",
    ip: "Localhost (::1)"
  });

  useEffect(() => {
    const ua = navigator.userAgent;
    let browser = "Web Browser";
    let os = "Desktop OS";

    if (ua.includes("Firefox")) browser = "Mozilla Firefox";
    else if (ua.includes("Edg")) browser = "Microsoft Edge";
    else if (ua.includes("Chrome")) browser = "Google Chrome";
    else if (ua.includes("Safari")) browser = "Apple Safari";

    if (ua.includes("Win")) os = "Windows";
    else if (ua.includes("Mac")) os = "macOS";
    else if (ua.includes("Linux")) os = "Linux";
    else if (ua.includes("Android")) os = "Android Device";
    else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS Device";

    setCurrentSessionInfo({
      device: `${browser} (${os})`,
      os,
      ip: window.location.hostname || "127.0.0.1"
    });
  }, []);

  // Real User Settings State per user account
  const settingsStorageKey = user?.id ? `avelis_settings_${user.id}` : "avelis_settings_guest";

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

  // Load real preferences from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(settingsStorageKey);
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
        console.error("Failed to parse user settings", e);
      }
    }
  }, [settingsStorageKey]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
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
        updatedAt: new Date().toISOString()
      };

      localStorage.setItem(settingsStorageKey, JSON.stringify(settings));
      if (showToast) showToast("Sanctuary settings updated successfully.");
    } catch (err) {
      if (showToast) showToast("Failed to save settings.");
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
      <div className="border-b border-[rgba(201,162,39,0.1)] pb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="font-display text-4xl sm:text-5xl tracking-[0.02em] leading-tight text-[#F7F5EE]">
            Sanctuary Settings
          </h2>
          <p className="font-body text-xs text-[#F7F5EE]/60 mt-2">
            Personalize preferences, security, and typography for account{" "}
            <span className="text-[#C9A227] font-semibold">{user?.email || "Authenticated Scholar"}</span>.
          </p>
        </div>

        {/* Real User Identity Chip */}
        <div className="flex items-center gap-3 bg-[#0D1626] border border-[#C9A227]/30 rounded-xl px-4 py-2.5 shadow-md">
          <User className="w-4 h-4 text-[#C9A227]" />
          <div>
            <span className="block font-display text-xs text-white uppercase font-bold">
              {user?.name || user?.username || "Archival Scholar"}
            </span>
            <span className="block text-[10px] text-[#C9A227] tracking-wider uppercase font-semibold">
              Role: {user?.role || "MEMBER"}
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Preferences */}
        <div className="lg:col-span-7 space-y-8">
          {/* Appearance Section */}
          <div className="bg-[#0D1626]/40 border border-[rgba(201,162,39,0.12)] rounded-lg p-6 sm:p-8 space-y-6 shadow-[0_15px_35px_rgba(0,0,0,0.2)]">
            <span className="block font-display text-sm tracking-[0.15em] text-[#F7F5EE] uppercase border-b border-[rgba(201,162,39,0.1)] pb-3">
              Appearance & Theme
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label htmlFor="theme" className="font-display text-[9px] tracking-[0.2em] uppercase text-[#F7F5EE]/70 select-none">
                  Application Theme
                </label>
                <select id="theme" disabled value="dark" className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(201,162,39,0.18)] rounded px-4 py-3 text-[#F7F5EE]/50 font-body text-xs focus:outline-none opacity-60 cursor-not-allowed">
                  <option value="dark">Dark Sanctum (Active)</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-display text-[9px] tracking-[0.2em] uppercase text-[#F7F5EE]/70 select-none">
                  Accent Shade
                </label>
                <div className="flex items-center gap-3 h-11 px-4 bg-[rgba(255,255,255,0.02)] border border-[rgba(201,162,39,0.1)] rounded opacity-80">
                  <div className="w-4.5 h-4.5 rounded-full bg-[#C9A227] shadow-[0_0_10px_rgba(201,162,39,0.4)]" />
                  <span className="font-display text-[10px] tracking-wider text-[#C9A227] uppercase font-bold">
                    Aureolin Gold
                  </span>
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
                  <option value="serif">Editorial Serif (Cinzel / Cormorant)</option>
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
              Notifications & Digest
            </span>

            <div className="space-y-4">
              <Toggle
                checked={emailNotif}
                onChange={setEmailNotif}
                label="Email Correspondence"
                description={`Send updates to ${user?.email || "registered email"}.`}
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
                description="Alerts for active loan return deadlines."
              />
              <div className="h-[1px] bg-[rgba(201,162,39,0.08)]" />
              <Toggle
                checked={productUpdates}
                onChange={setProductUpdates}
                label="Physical Copies & Bundles"
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
                description="Allow other members to view your public reviews."
              />
              <div className="h-[1px] bg-[rgba(201,162,39,0.08)]" />
              <Toggle
                checked={activityVisible}
                onChange={setActivityVisible}
                label="Publish Reading Log"
                description="Display active borrowings in community feed."
              />
              <div className="h-[1px] bg-[rgba(201,162,39,0.08)]" />
              <Toggle
                checked={journalPrivate}
                onChange={setJournalPrivate}
                label="Immutable Journal Privacy"
                description="Set your journal reflections to private by default."
              />
            </div>
          </div>

          {/* Session Security Section */}
          <div className="bg-[#0D1626]/40 border border-[rgba(201,162,39,0.12)] rounded-lg p-6 sm:p-8 space-y-6 shadow-[0_15px_35px_rgba(0,0,0,0.2)]">
            <span className="block font-display text-sm tracking-[0.15em] text-[#F7F5EE] uppercase border-b border-[rgba(201,162,39,0.1)] pb-3 font-semibold text-[#C9A227]">
              Real Session & Security
            </span>

            <div className="space-y-4 text-xs">
              <div className="flex items-center gap-3 p-3 bg-[#07111F] rounded-lg border border-emerald-500/20">
                <Monitor className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <div className="flex-grow min-w-0">
                  <span className="block text-white font-semibold truncate">
                    {currentSessionInfo.device}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold block">
                    Active Session • IP: {currentSessionInfo.ip}
                  </span>
                </div>
              </div>

              <div className="h-[1px] bg-[rgba(201,162,39,0.08)]" />

              <button
                type="button"
                onClick={handleSignOutEverywhere}
                className="w-full flex items-center justify-center gap-2 border border-red-500/20 hover:border-red-500/50 text-red-400 hover:text-red-300 py-3 rounded-lg font-display text-[9px] tracking-[0.15em] uppercase transition-all duration-300 bg-red-950/10 hover:bg-red-950/20 cursor-pointer font-bold"
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

export default SettingsView;
