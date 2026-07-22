"use client";

import { useEffect, useState } from "react";
import { Building2, CheckCircle2, Clock3, GitBranch } from "lucide-react";
import { getToken } from "@/lib/session";
import {
  getRecentActivity,
  RecentActivityItem,
} from "@/lib/dashboard-api";
import { useToast } from "@/components/ui/ToastProvider";

function activityIcon(type: string) {
  if (type === "MATCH") return CheckCircle2;
  if (type === "PROPERTY") return Building2;
  return GitBranch;
}

function activityColor(type: string) {
  if (type === "MATCH") return "bg-green-50 text-green-500";
  if (type === "PROPERTY") return "bg-blue-50 text-blue-500";
  return "bg-orange-50 text-orange-500";
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

export default function RecentActivity() {
  const toast = useToast();
  const [activities, setActivities] = useState<RecentActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadActivity() {
      const token = getToken();

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const data = await getRecentActivity(token);
        setActivities(data);
      } catch (error) {
        toast.error(
          "Unable to load activity",
          error instanceof Error ? error.message : "Failed to load recent activity"
        );
      } finally {
        setLoading(false);
      }
    }

    loadActivity();
  }, [toast]);

  return (
    <div className="rounded-[28px] border border-[#E9EDF3] bg-white p-7 shadow-[0_8px_24px_rgba(15,35,64,0.05)]">
      <h3 className="mb-6 text-[20px] font-semibold tracking-[-0.02em] text-[#0F2340]">
        Recent Activity
      </h3>

      {loading ? (
        <div className="text-[15px] text-gray-500">Loading activity...</div>
      ) : activities.length === 0 ? (
        <div className="rounded-[22px] bg-[#F8FAFC] p-6 text-[15px] text-gray-500">
          No recent activity yet.
        </div>
      ) : (
        <div className="space-y-5">
          {activities.map((activity) => {
            const Icon = activityIcon(activity.type);

            return (
              <div
                key={activity.id}
                className="flex items-start justify-between gap-4 border-b border-[#F1F4F8] pb-4 last:border-b-0"
              >
                <div className="flex gap-4">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-full ${activityColor(
                      activity.type
                    )}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="text-[17px] font-semibold text-[#0F2340]">
                      {activity.title}
                    </p>
                    <p className="text-[15px] leading-6 text-gray-600">
                      {activity.description}
                    </p>
                  </div>
                </div>

                <span className="whitespace-nowrap text-[14px] text-gray-500">
                  {timeAgo(activity.createdAt)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}