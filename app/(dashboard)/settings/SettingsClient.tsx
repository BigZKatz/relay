"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import {
  Ban,
  BarChart3,
  Building2,
  Check,
  ChevronDown,
  Clock3,
  Headphones,
  Mail,
  Phone,
  Plus,
  Users,
  Volume2,
  Webhook,
} from "lucide-react";

type PropertyOption = {
  id: string;
  name: string;
  address: string;
  timezone: string;
  phone: string | null;
  twilioNumber: string | null;
};

type MediaConfig = {
  ready: boolean;
  publicBaseUrl: string | null;
  message: string | null;
};

type SettingsPayload = {
  id: string;
  name: string;
  address?: string;
  phone?: string | null;
  twilioNumber?: string | null;
  timezone: string;
  websiteUrl: string | null;
  applyUrl: string | null;
  floorPlansUrl: string | null;
  reviewUrl: string | null;
  settings: {
    afterHoursEnabled: boolean;
    afterHoursMessage: string | null;
    soundEnabled: boolean;
    repeatSoundUntilRead: boolean;
    emailNotificationsEnabled: boolean;
    analyticsEnabled: boolean;
    helpEmail: string | null;
  } | null;
  businessHours: {
    dayOfWeek: number;
    isClosed: boolean;
    openTime: string | null;
    closeTime: string | null;
  }[];
  notificationRecipients: {
    email: string;
    roleLabel: string | null;
    enabled: boolean;
  }[];
  users: {
    name: string;
    email: string;
    role: string;
    isMasterAdmin: boolean;
    active: boolean;
  }[];
};

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function Toggle({ enabled, onClick }: { enabled: boolean; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabled ? "bg-blue-600" : "bg-slate-200"}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  );
}

function SectionCard({ icon, iconClass, title, subtitle, badge, children }: { icon: React.ReactNode; iconClass: string; title: string; subtitle: string; badge?: React.ReactNode; children: React.ReactNode; }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4">
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconClass}`}>{icon}</div>
        <div>
          <h2 className="font-semibold text-slate-900">{title}</h2>
          <p className="text-sm text-slate-500">{subtitle}</p>
        </div>
        {badge && <div className="ml-auto">{badge}</div>}
      </div>
      <div className="space-y-4 px-6 py-4">{children}</div>
    </div>
  );
}

function createFormState(property: SettingsPayload | null) {
  return {
    property: {
      name: property?.name ?? "",
      address: property?.address ?? "",
      phone: property?.phone ?? "",
      twilioNumber: property?.twilioNumber ?? "",
      timezone: property?.timezone ?? "America/Denver",
      websiteUrl: property?.websiteUrl ?? "",
      applyUrl: property?.applyUrl ?? "",
      floorPlansUrl: property?.floorPlansUrl ?? "",
      reviewUrl: property?.reviewUrl ?? "",
    },
    settings: {
      afterHoursEnabled: property?.settings?.afterHoursEnabled ?? false,
      afterHoursMessage: property?.settings?.afterHoursMessage ?? "",
      soundEnabled: property?.settings?.soundEnabled ?? true,
      repeatSoundUntilRead: property?.settings?.repeatSoundUntilRead ?? false,
      emailNotificationsEnabled: property?.settings?.emailNotificationsEnabled ?? true,
      analyticsEnabled: property?.settings?.analyticsEnabled ?? true,
      helpEmail: property?.settings?.helpEmail ?? "",
    },
    businessHours: property?.businessHours ?? [],
    notificationRecipients: property?.notificationRecipients?.length
      ? property.notificationRecipients
      : [{ email: "", roleLabel: "", enabled: true }],
    users: property?.users?.length
      ? property.users
      : [{ name: "", email: "", role: "staff", isMasterAdmin: false, active: true }],
  };
}

export default function SettingsClient({
  property,
  properties,
  selectedPropertyId,
}: {
  property: SettingsPayload | null;
  properties: PropertyOption[];
  selectedPropertyId: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState(() => createFormState(property));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [switchingProperty, setSwitchingProperty] = useState(false);
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [creatingProperty, setCreatingProperty] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [mediaConfig, setMediaConfig] = useState<MediaConfig | null>(null);
  const [newProperty, setNewProperty] = useState({
    name: "",
    address: "",
    phone: "",
    twilioNumber: "",
    timezone: property?.timezone ?? "America/Denver",
    websiteUrl: "",
    applyUrl: "",
    floorPlansUrl: "",
    reviewUrl: "",
  });

  useEffect(() => {
    setForm(createFormState(property));
    setSaved(false);
    setSaving(false);
    setSwitchingProperty(false);
    setCreateError(null);
    setNewProperty({
      name: "",
      address: "",
      phone: "",
      twilioNumber: "",
      timezone: property?.timezone ?? "America/Denver",
      websiteUrl: "",
      applyUrl: "",
      floorPlansUrl: "",
      reviewUrl: "",
    });
  }, [property]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/media-config");
        if (!res.ok) return;
        const data = (await res.json()) as MediaConfig;
        if (!cancelled) setMediaConfig(data);
      } catch {
        if (!cancelled) setMediaConfig(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedProperty = properties.find((item) => item.id === selectedPropertyId) ?? properties[0];
  const analyticsCards = useMemo(
    () => [
      ["Prospects", "148", "bg-violet-100 text-violet-700"],
      ["Applicants", "92", "bg-amber-100 text-amber-700"],
      ["Future Residents", "34", "bg-indigo-100 text-indigo-700"],
      ["Residents", "286", "bg-emerald-100 text-emerald-700"],
    ],
    []
  );

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setCreateError(null);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: selectedPropertyId,
          ...form,
        }),
      });

      if (!res.ok) {
        setCreateError("Could not save settings. Please try again.");
        return;
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  function handlePropertySwitch(nextPropertyId: string) {
    if (!nextPropertyId || nextPropertyId === selectedPropertyId) return;
    setSwitchingProperty(true);
    router.push(`/settings?propertyId=${nextPropertyId}`);
  }

  async function handleCreateProperty() {
    if (!newProperty.name.trim()) {
      setCreateError("Property name is required.");
      return;
    }

    setCreatingProperty(true);
    setCreateError(null);

    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newProperty),
    });

    setCreatingProperty(false);

    if (!res.ok) {
      setCreateError("Could not create the property. Please try again.");
      return;
    }

    const data = await res.json();
    setShowAddProperty(false);
    setNewProperty({
      name: "",
      address: "",
      phone: "",
      twilioNumber: "",
      timezone: property?.timezone ?? "America/Denver",
      websiteUrl: "",
      applyUrl: "",
      floorPlansUrl: "",
      reviewUrl: "",
    });
    router.push(`/settings?propertyId=${data.selectedPropertyId}`);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-6xl p-4 lg:p-8">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
          <p className="mt-1 text-slate-500">Operations, notifications, staff access, and property controls</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setShowAddProperty((prev) => !prev)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
          >
            <Plus className="h-4 w-4" />
            Add property
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || switchingProperty}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${saving ? "bg-slate-200 text-slate-500" : saved ? "bg-emerald-600 text-white" : "bg-blue-600 text-white hover:bg-blue-700"}`}
          >
            {switchingProperty ? "Switching..." : saving ? "Saving..." : saved ? "Saved" : "Save settings"}
          </button>
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-5 text-white shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-slate-200">
              <Building2 className="h-3.5 w-3.5" />
              Multi-property settings
            </div>
            <div>
              <p className="text-sm text-slate-300">Currently editing</p>
              <h2 className="text-xl font-semibold">{selectedProperty?.name ?? property?.name ?? "Property"}</h2>
              <p className="mt-1 text-sm text-slate-400">
                {selectedProperty?.address || form.property.address || "Add an address, numbers, and links for this property."}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-[minmax(0,260px)_auto] sm:items-end">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-400">Property switcher</span>
              <div className="relative">
                <select
                  value={selectedPropertyId}
                  onChange={(e) => handlePropertySwitch(e.target.value)}
                  disabled={switchingProperty}
                  className="w-full appearance-none rounded-xl border border-white/10 bg-white/10 px-4 py-3 pr-10 text-sm text-white outline-none transition focus:border-blue-400"
                >
                  {properties.map((item) => (
                    <option key={item.id} value={item.id} className="text-slate-900">
                      {item.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
              </div>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-xs text-slate-400">Properties</p>
                <p className="mt-1 text-lg font-semibold">{properties.length}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-xs text-slate-400">Timezone</p>
                <p className="mt-1 text-sm font-semibold">{form.property.timezone}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showAddProperty && (
        <div className="mb-6 rounded-2xl border border-dashed border-blue-200 bg-blue-50/70 p-5">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Add Property</h2>
              <p className="mt-1 text-sm text-slate-600">Create a new property shell, then land directly in its settings.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowAddProperty(false);
                setCreateError(null);
              }}
              className="text-sm font-medium text-slate-500 hover:text-slate-700"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[
              ["Property name", "name"],
              ["Address", "address"],
              ["Leasing phone", "phone"],
              ["Twilio number", "twilioNumber"],
              ["Timezone", "timezone"],
              ["Website URL", "websiteUrl"],
              ["Apply URL", "applyUrl"],
              ["Floor plans URL", "floorPlansUrl"],
              ["Review URL", "reviewUrl"],
            ].map(([label, key]) => (
              <div key={key}>
                <label className="mb-1 block text-xs font-medium text-slate-500">{label}</label>
                <input
                  value={newProperty[key as keyof typeof newProperty]}
                  onChange={(e) => setNewProperty((prev) => ({ ...prev, [key]: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                  placeholder={label}
                />
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleCreateProperty}
              disabled={creatingProperty}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-slate-300"
            >
              {creatingProperty ? "Creating..." : <><Check className="h-4 w-4" /> Create property</>}
            </button>
            {createError && <p className="text-sm text-rose-600">{createError}</p>}
          </div>
        </div>
      )}

      {createError && !showAddProperty && (
        <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{createError}</div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <SectionCard icon={<Phone className="h-4 w-4 text-red-600" />} iconClass="bg-red-50" title="Twilio SMS" subtitle="SMS delivery engine">
          <p className="text-sm text-slate-600">Configure Twilio in environment variables. Settings here control behavior around inbound and outbound handling.</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Leasing phone</label>
              <input value={form.property.phone} onChange={(e) => setForm((prev) => ({ ...prev, property: { ...prev.property, phone: e.target.value } }))} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700" placeholder="+1 555 555 5555" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Twilio number</label>
              <input value={form.property.twilioNumber} onChange={(e) => setForm((prev) => ({ ...prev, property: { ...prev.property, twilioNumber: e.target.value } }))} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700" placeholder="+1 555 555 1234" />
            </div>
          </div>
        </SectionCard>

        <SectionCard icon={<Webhook className="h-4 w-4 text-purple-600" />} iconClass="bg-purple-50" title="Reply Webhook" subtitle="Inbound message handling">
          <div className="space-y-3">
            <div className="select-all rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm font-medium text-slate-700">/api/webhook/twilio</div>
            <div
              className={cn(
                "rounded-lg px-3 py-2 text-xs",
                mediaConfig?.ready
                  ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border border-amber-200 bg-amber-50 text-amber-800"
              )}
            >
              <p className="font-medium">
                {mediaConfig?.ready
                  ? "Outbound MMS is configured with a public app URL."
                  : "Outbound MMS requires a public HTTPS app URL."}
              </p>
              <p className="mt-1">
                {mediaConfig?.ready ? (
                  <>
                    Twilio can fetch uploaded media from <span className="font-mono">{mediaConfig.publicBaseUrl}</span>.
                  </>
                ) : (
                  <>
                    {mediaConfig?.message ?? (
                      <>
                        Set <span className="font-mono">PUBLIC_APP_URL</span> or <span className="font-mono">NEXT_PUBLIC_APP_URL</span> to your live Relay base URL so Twilio can fetch uploaded media. Localhost and private LAN URLs will not work.
                      </>
                    )}
                  </>
                )}
              </p>
            </div>
          </div>
        </SectionCard>

        <SectionCard icon={<Clock3 className="h-4 w-4 text-amber-600" />} iconClass="bg-amber-50" title="After-hours auto response" subtitle="Send a custom reply when messages arrive outside office hours" badge={<Toggle enabled={form.settings.afterHoursEnabled} onClick={() => setForm((prev) => ({ ...prev, settings: { ...prev.settings, afterHoursEnabled: !prev.settings.afterHoursEnabled } }))} />}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Time zone</label>
              <input value={form.property.timezone} onChange={(e) => setForm((prev) => ({ ...prev, property: { ...prev.property, timezone: e.target.value } }))} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Trigger mode</label>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">Outside business hours</div>
            </div>
          </div>
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <div className="grid grid-cols-4 bg-slate-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              <div>Day</div><div>Closed</div><div>Open</div><div>Close</div>
            </div>
            {form.businessHours.map((row, index) => (
              <div key={row.dayOfWeek} className="grid grid-cols-4 items-center gap-2 border-t border-slate-100 px-4 py-2.5 text-sm">
                <div className="font-medium text-slate-700">{dayNames[row.dayOfWeek]}</div>
                <input type="checkbox" checked={row.isClosed} onChange={(e) => setForm((prev) => {
                  const next = [...prev.businessHours];
                  next[index] = { ...next[index], isClosed: e.target.checked };
                  return { ...prev, businessHours: next };
                })} className="h-4 w-4" />
                <input value={row.openTime ?? ""} disabled={row.isClosed} onChange={(e) => setForm((prev) => {
                  const next = [...prev.businessHours];
                  next[index] = { ...next[index], openTime: e.target.value };
                  return { ...prev, businessHours: next };
                })} className="rounded border border-slate-200 bg-slate-50 px-2 py-1" />
                <input value={row.closeTime ?? ""} disabled={row.isClosed} onChange={(e) => setForm((prev) => {
                  const next = [...prev.businessHours];
                  next[index] = { ...next[index], closeTime: e.target.value };
                  return { ...prev, businessHours: next };
                })} className="rounded border border-slate-200 bg-slate-50 px-2 py-1" />
              </div>
            ))}
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Auto response message</label>
            <textarea value={form.settings.afterHoursMessage} onChange={(e) => setForm((prev) => ({ ...prev, settings: { ...prev.settings, afterHoursMessage: e.target.value } }))} rows={5} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-700" />
          </div>
        </SectionCard>

        <SectionCard icon={<Mail className="h-4 w-4 text-blue-600" />} iconClass="bg-blue-50" title="Email notifications" subtitle="Choose who gets alerted when inbound texts arrive" badge={<Toggle enabled={form.settings.emailNotificationsEnabled} onClick={() => setForm((prev) => ({ ...prev, settings: { ...prev.settings, emailNotificationsEnabled: !prev.settings.emailNotificationsEnabled } }))} />}>
          <div className="space-y-3">
            {form.notificationRecipients.map((entry, index) => (
              <div key={`${entry.email}-${index}`} className="grid grid-cols-12 items-center gap-2 rounded-lg border border-slate-200 px-3 py-3">
                <input type="checkbox" checked={entry.enabled} onChange={(e) => setForm((prev) => {
                  const next = [...prev.notificationRecipients];
                  next[index] = { ...next[index], enabled: e.target.checked };
                  return { ...prev, notificationRecipients: next };
                })} className="col-span-1 h-4 w-4" />
                <input value={entry.email} onChange={(e) => setForm((prev) => {
                  const next = [...prev.notificationRecipients];
                  next[index] = { ...next[index], email: e.target.value };
                  return { ...prev, notificationRecipients: next };
                })} className="col-span-7 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm" placeholder="email@company.com" />
                <input value={entry.roleLabel ?? ""} onChange={(e) => setForm((prev) => {
                  const next = [...prev.notificationRecipients];
                  next[index] = { ...next[index], roleLabel: e.target.value };
                  return { ...prev, notificationRecipients: next };
                })} className="col-span-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm" placeholder="Role" />
                <button type="button" onClick={() => setForm((prev) => ({ ...prev, notificationRecipients: prev.notificationRecipients.filter((_, i) => i !== index) }))} className="col-span-1 text-slate-400 hover:text-red-500">×</button>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => setForm((prev) => ({ ...prev, notificationRecipients: [...prev.notificationRecipients, { email: "", roleLabel: "", enabled: true }] }))} className="text-sm font-medium text-blue-600 hover:text-blue-700">+ Add notification email</button>
        </SectionCard>

        <SectionCard icon={<Volume2 className="h-4 w-4 text-violet-600" />} iconClass="bg-violet-50" title="Alert sounds" subtitle="Control sound behavior for new inbound messages">
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3"><div><p className="text-sm font-medium text-slate-800">Play sound on new message</p></div><Toggle enabled={form.settings.soundEnabled} onClick={() => setForm((prev) => ({ ...prev, settings: { ...prev.settings, soundEnabled: !prev.settings.soundEnabled } }))} /></div>
            <div className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3"><div><p className="text-sm font-medium text-slate-800">Repeat sound every minute until read</p></div><Toggle enabled={form.settings.repeatSoundUntilRead} onClick={() => setForm((prev) => ({ ...prev, settings: { ...prev.settings, repeatSoundUntilRead: !prev.settings.repeatSoundUntilRead } }))} /></div>
          </div>
        </SectionCard>

        <SectionCard icon={<Users className="h-4 w-4 text-emerald-600" />} iconClass="bg-emerald-50" title="Staff access" subtitle="Manage user accounts and permissions">
          <div className="space-y-3">
            {form.users.map((user, index) => (
              <div key={`${user.email}-${index}`} className="grid grid-cols-12 items-center gap-2 rounded-lg border border-slate-200 px-3 py-3">
                <input value={user.name} onChange={(e) => setForm((prev) => {
                  const next = [...prev.users];
                  next[index] = { ...next[index], name: e.target.value };
                  return { ...prev, users: next };
                })} className="col-span-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm" placeholder="Name" />
                <input value={user.email} onChange={(e) => setForm((prev) => {
                  const next = [...prev.users];
                  next[index] = { ...next[index], email: e.target.value };
                  return { ...prev, users: next };
                })} className="col-span-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm" placeholder="Email" />
                <input value={user.role} onChange={(e) => setForm((prev) => {
                  const next = [...prev.users];
                  next[index] = { ...next[index], role: e.target.value };
                  return { ...prev, users: next };
                })} className="col-span-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm" placeholder="Role" />
                <label className="col-span-1 flex items-center justify-center"><input type="checkbox" checked={user.isMasterAdmin} onChange={(e) => setForm((prev) => {
                  const next = [...prev.users];
                  next[index] = { ...next[index], isMasterAdmin: e.target.checked };
                  return { ...prev, users: next };
                })} className="h-4 w-4" /></label>
                <button type="button" onClick={() => setForm((prev) => ({ ...prev, users: prev.users.filter((_, i) => i !== index) }))} className="col-span-1 text-slate-400 hover:text-red-500">×</button>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => setForm((prev) => ({ ...prev, users: [...prev.users, { name: "", email: "", role: "staff", isMasterAdmin: false, active: true }] }))} className="text-sm font-medium text-blue-600 hover:text-blue-700">+ Add user</button>
        </SectionCard>

        <SectionCard icon={<BarChart3 className="h-4 w-4 text-cyan-600" />} iconClass="bg-cyan-50" title="Message analytics" subtitle="Track volume, response gaps, and follow-up health" badge={<Toggle enabled={form.settings.analyticsEnabled} onClick={() => setForm((prev) => ({ ...prev, settings: { ...prev.settings, analyticsEnabled: !prev.settings.analyticsEnabled } }))} />}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {analyticsCards.map(([label, value, color]) => (
              <div key={label} className="rounded-xl border border-slate-200 p-4"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-xl font-bold text-slate-900">{value}</p><span className={`mt-2 inline-flex rounded-full px-2 py-1 text-[11px] font-medium ${color}`}>{form.settings.analyticsEnabled ? "Tracked" : "Off"}</span></div>
            ))}
          </div>
        </SectionCard>

        <SectionCard icon={<Ban className="h-4 w-4 text-rose-600" />} iconClass="bg-rose-50" title="Opt-outs" subtitle="Track who can no longer receive messages">
          <div className="space-y-3">
            {[["Jordan Miles", "Prospect", "STOP received"], ["Kevin Lee", "Resident", "Do not text requested"]].map(([name, type, reason]) => (
              <div key={name} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3"><div><p className="text-sm font-medium text-slate-800">{name}</p><p className="text-xs text-slate-400">{type} · {reason}</p></div><span className="rounded-full bg-slate-200 px-2 py-1 text-[11px] font-medium text-slate-700">Messaging disabled</span></div>
            ))}
          </div>
        </SectionCard>

        <SectionCard icon={<Building2 className="h-4 w-4 text-blue-600" />} iconClass="bg-blue-50" title="Property Quick Links" subtitle="Saved links that staff can send instantly from threads">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div><label className="mb-1 block text-xs font-medium text-slate-500">Property name</label><input value={form.property.name} onChange={(e) => setForm((prev) => ({ ...prev, property: { ...prev.property, name: e.target.value } }))} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm" /></div>
            <div><label className="mb-1 block text-xs font-medium text-slate-500">Primary time zone</label><input value={form.property.timezone} onChange={(e) => setForm((prev) => ({ ...prev, property: { ...prev.property, timezone: e.target.value } }))} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm" /></div>
            <div className="sm:col-span-2"><label className="mb-1 block text-xs font-medium text-slate-500">Property address</label><input value={form.property.address} onChange={(e) => setForm((prev) => ({ ...prev, property: { ...prev.property, address: e.target.value } }))} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm" /></div>
          </div>
          <div className="space-y-3">
            {[
              ["Website", "websiteUrl"],
              ["Apply now", "applyUrl"],
              ["Floor plans", "floorPlansUrl"],
              ["Leave a review", "reviewUrl"],
            ].map(([label, key]) => (
              <div key={key}>
                <label className="mb-1 block text-xs font-medium text-slate-500">{label}</label>
                <input value={form.property[key as keyof typeof form.property] as string} onChange={(e) => setForm((prev) => ({ ...prev, property: { ...prev.property, [key]: e.target.value } }))} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard icon={<Building2 className="h-4 w-4 text-blue-600" />} iconClass="bg-blue-50" title="Entrata API" subtitle="Resident data sync and communication logging">
          <div className="rounded-lg border border-slate-200 px-4 py-3 text-sm text-slate-600">Sync is scaffolded. Next step is wiring scheduled sync plus webhook or event-driven updates.</div>
        </SectionCard>

        <SectionCard icon={<Headphones className="h-4 w-4 text-fuchsia-600" />} iconClass="bg-fuchsia-50" title="Help and support" subtitle="Basic troubleshooting and technical contact info">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Support email</label>
            <input value={form.settings.helpEmail} onChange={(e) => setForm((prev) => ({ ...prev, settings: { ...prev.settings, helpEmail: e.target.value } }))} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
          </div>
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
            <li>Check the Twilio webhook URL if inbound messages stop appearing.</li>
            <li>Verify notification emails are enabled if staff stop receiving alerts.</li>
            <li>Confirm business hours and time zone if after-hours replies fire at the wrong time.</li>
          </ul>
        </SectionCard>
      </div>
    </div>
  );
}
