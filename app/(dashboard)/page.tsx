import { db } from "@/lib/db";
import {
  MessageSquare,
  Users,
  CheckCircle,
  TrendingUp,
  Radio,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { relativeTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

async function getStats() {
  const [totalMessages, totalResidents, sentToday, recentMessages] =
    await Promise.all([
      db.message.count(),
      db.resident.count({ where: { status: "active" } }),
      db.message.count({
        where: {
          status: "sent",
          sentAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
      db.message.findMany({
        take: 6,
        orderBy: { createdAt: "desc" },
        include: {
          property: { select: { name: true } },
          recipients: {
            select: {
              status: true,
              residentId: true,
            },
          },
        },
      }),
    ]);

  const deliveredCount = await db.messageRecipient.count({
    where: { status: "delivered" },
  });
  const totalRecipients = await db.messageRecipient.count();
  const deliveryRate =
    totalRecipients > 0
      ? Math.round((deliveredCount / totalRecipients) * 100)
      : 0;

  return { totalMessages, totalResidents, sentToday, deliveryRate, recentMessages };
}

const statusColors: Record<string, string> = {
  sent: "bg-emerald-100 text-emerald-700",
  failed: "bg-red-100 text-red-700",
  pending: "bg-amber-100 text-amber-700",
  partial: "bg-orange-100 text-orange-700",
};

export default async function DashboardPage() {
  const { totalMessages, totalResidents, sentToday, deliveryRate, recentMessages } =
    await getStats();

  const stats = [
    {
      label: "Messages Sent Today",
      value: sentToday,
      icon: MessageSquare,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Active Residents",
      value: totalResidents,
      icon: Users,
      color: "text-violet-600",
      bg: "bg-violet-50",
    },
    {
      label: "Delivery Rate",
      value: totalMessages === 0 ? "—" : `${deliveryRate}%`,
      icon: CheckCircle,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Total Messages",
      value: totalMessages,
      icon: TrendingUp,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ];

  return (
    <div className="px-4 py-5 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1 text-sm">
          Property messaging overview for today
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-lg border border-slate-200 p-3">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 ${s.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <div className="min-w-0">
                <div className="text-xl font-bold leading-none text-slate-900">{s.value}</div>
                <div className="text-xs text-slate-500 mt-1 truncate">{s.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Messages */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Recent Messages</h2>
            <Link
              href="/messages"
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {recentMessages.length === 0 ? (
              <div className="px-6 py-12 text-center text-slate-400">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No messages yet</p>
              </div>
            ) : (
              recentMessages.map((msg) => (
                <Link
                  key={msg.id}
                  href={msg.recipients.find((recipient) => recipient.residentId)?.residentId
                    ? `/messages?residentId=${msg.recipients.find((recipient) => recipient.residentId)?.residentId}`
                    : "/messages"}
                  className="px-6 py-4 flex items-start gap-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={cn(
                          "text-xs px-2 py-0.5 rounded-full font-medium",
                          statusColors[msg.status] ?? "bg-slate-100 text-slate-600"
                        )}
                      >
                        {msg.status}
                      </span>
                      <span className="text-xs text-slate-400 capitalize">
                        {msg.recipients.length > 1 ? "Group message" : "Direct message"}
                      </span>
                      {msg.property && (
                        <span className="text-xs text-slate-400">
                          · {msg.property.name}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-700 truncate">{msg.body}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {msg.recipients.length} recipient
                      {msg.recipients.length !== 1 ? "s" : ""} ·{" "}
                      {relativeTime(msg.createdAt)}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-white">
            <Radio className="w-8 h-8 mb-3 opacity-80" />
            <h3 className="font-semibold text-lg mb-1">Send a Message</h3>
            <p className="text-blue-100 text-sm mb-4">
              Reach residents instantly with personalized or community messages.
            </p>
            <Link
              href="/compose"
              className="inline-flex items-center gap-2 bg-white text-blue-700 font-semibold text-sm px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors"
            >
              Compose <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 mb-3">
              Entrata Sync Status
            </h3>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-sm text-slate-600">API pending setup</span>
            </div>
            <p className="text-xs text-slate-400">
              Prospects, applicants, future residents, and residents are currently loaded from the local database. Connect Entrata API in
              Settings to enable live sync and communication logging.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
