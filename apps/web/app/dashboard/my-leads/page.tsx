"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  Euro,
  MapPin,
  Search,
  Target,
  UserCheck,
  UserPlus,
} from "lucide-react";

import { getToken, getStoredUser } from "@/lib/session";
import type { AuthUser } from "@/lib/auth-api";
import { getLeads, getMyLeads, type Lead } from "@/lib/leads-api";
import { useToast } from "@/components/ui/ToastProvider";

function qualityBadge(quality: Lead["quality"]) {
  if (quality === "HOT") return "bg-red-50 text-red-600";
  if (quality === "WARM") return "bg-yellow-50 text-yellow-700";
  return "bg-blue-50 text-blue-600";
}

function statusBadge(status: string) {
  if (status === "ACTIVE") return "bg-green-50 text-green-700";
  if (status === "CONTACTED") return "bg-purple-50 text-purple-700";
  if (status === "COMPLETED") return "bg-emerald-50 text-emerald-700";
  if (status === "MATCHED") return "bg-green-50 text-green-700";
  if (status === "PENDING") return "bg-yellow-50 text-yellow-700";
  if (status === "NEW") return "bg-blue-50 text-blue-700";
  if (status === "CLOSED") return "bg-gray-100 text-gray-700";
  return "bg-red-50 text-red-600";
}

export default function MyLeadsPage() {
  const toast = useToast();
  const user = getStoredUser<AuthUser>();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLeads() {
      const token = getToken();

      if (!token) {
        toast.warning("Session required", "Please sign in again.");
        setLoading(false);
        return;
      }

      try {
        const data = await getMyLeads(token);
        setLeads(data);
      } catch (error) {
        toast.error(
          "Unable to load requests",
          error instanceof Error
            ? error.message
            : "Failed to load your requests."
        );
      } finally {
        setLoading(false);
      }
    }

    loadLeads();
  }, [toast]);

  const filteredLeads = useMemo(() => {
    const q = search.toLowerCase().trim();

    if (!q) return leads;

    return leads.filter((lead) => {
      const bestMatch = lead.matches?.[0];

      return [
        lead.fullName,
        lead.email,
        lead.source,
        lead.interest,
        lead.location,
        lead.budget,
        lead.quality,
        lead.status,
        bestMatch?.status,
        bestMatch?.professional?.companyName,
        bestMatch?.professional?.user?.fullName,
        bestMatch?.professional?.professionalType,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q));
    });
  }, [leads, search]);

  const stats = {
    total: leads.length,
    hot: leads.filter((lead) => lead.quality === "HOT").length,
    matched: leads.filter((lead) => (lead.matches?.length || 0) > 0).length,
    contacted: leads.filter((lead) =>
      lead.matches?.some((match) => match.status === "CONTACTED")
    ).length,
  };

  if (user?.role !== "BUYER") {
    return (
      <div className="rounded-3xl border border-[#1B365D] bg-white p-10 text-center">
        <h2 className="text-2xl font-bold text-[#0F2340]">Access denied</h2>
        <p className="mt-3 text-[#667085]">
          Only buyers can access their personal requests.
        </p>
      </div>
    );
  }

  if (loading) {
    return <div className="text-[#667085]">Loading your requests...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[48px] font-semibold leading-[1.02] tracking-[-0.03em] text-[#0F2340] lg:text-[56px]">
          My Requests
        </h1>

        <p className="mt-2 text-[18px] text-[#667085]">
          Track your property requests, qualification status and matching
          progress.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[28px] border border-[#E4E7EC] bg-white p-7 shadow-[0_6px_22px_rgba(16,24,40,0.05)]">
          <UserPlus className="h-7 w-7 text-[#1B365D]" />
          <p className="mt-8 text-[42px] font-semibold text-[#0F2340]">
            {stats.total}
          </p>
          <p className="text-[#667085]">Total Requests</p>
        </div>

        <div className="rounded-[28px] border border-[#E4E7EC] bg-white p-7 shadow-[0_6px_22px_rgba(16,24,40,0.05)]">
          <Target className="h-7 w-7 text-red-500" />
          <p className="mt-8 text-[42px] font-semibold text-[#0F2340]">
            {stats.hot}
          </p>
          <p className="text-[#667085]">Hot Requests</p>
        </div>

        <div className="rounded-[28px] border border-[#E4E7EC] bg-white p-7 shadow-[0_6px_22px_rgba(16,24,40,0.05)]">
          <UserCheck className="h-7 w-7 text-green-600" />
          <p className="mt-8 text-[42px] font-semibold text-[#0F2340]">
            {stats.matched}
          </p>
          <p className="text-[#667085]">Matched Requests</p>
        </div>

        <div className="rounded-[28px] border border-[#E4E7EC] bg-white p-7 shadow-[0_6px_22px_rgba(16,24,40,0.05)]">
          <Calendar className="h-7 w-7 text-purple-500" />
          <p className="mt-8 text-[42px] font-semibold text-[#0F2340]">
            {stats.contacted}
          </p>
          <p className="text-[#667085]">Contacted</p>
        </div>
      </div>

      <div className="rounded-[28px] border border-[#E4E7EC] bg-white shadow-[0_6px_22px_rgba(16,24,40,0.05)]">
        <div className="border-b border-[#EAECF0] p-6">
          <div className="relative max-w-[680px]">
            <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#98A2B3]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by source, professional, location or status..."
              className="h-14 w-full rounded-2xl border border-[#D0D5DD] bg-white pl-14 pr-4 text-[16px] text-[#0F2340] outline-none"
            />
          </div>
        </div>

        {filteredLeads.length === 0 ? (
          <div className="p-10 text-center">
            <h2 className="text-xl font-bold text-[#0F2340]">
              No requests found
            </h2>
            <p className="mt-2 text-[#667085]">
              Use a calculator or submit a request to start your buying journey.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#EAECF0]">
            {filteredLeads.map((lead) => {
              const bestMatch = lead.matches?.[0];
              const displayStatus = bestMatch?.status || lead.status;

              return (
                <div key={lead.id} className="p-6">
                  <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr_1fr_1fr]">
                    <div>
                      <p className="text-[18px] font-semibold text-[#0F2340]">
                        {lead.source || "Property Request"}
                      </p>
                      <p className="mt-1 text-[15px] text-[#667085]">
                        {lead.interest || "Property Purchase"}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-3 text-[14px] text-[#667085]">
                        <span className="inline-flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {lead.location || "Portugal"}
                        </span>

                        <span className="inline-flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {new Date(lead.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-semibold uppercase tracking-wide text-[#667085]">
                        Budget
                      </p>
                      <p className="mt-2 inline-flex items-center gap-2 text-[17px] font-semibold text-[#0F2340]">
                        <Euro className="h-4 w-4" />
                        {lead.budget || "-"}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-semibold uppercase tracking-wide text-[#667085]">
                        Quality
                      </p>
                      <span
                        className={`mt-2 inline-flex rounded-full px-4 py-2 text-sm font-semibold ${qualityBadge(
                          lead.quality
                        )}`}
                      >
                        {lead.quality}
                      </span>
                    </div>

                    <div>
                      <p className="text-sm font-semibold uppercase tracking-wide text-[#667085]">
                        Progress
                      </p>
                      <span
                        className={`mt-2 inline-flex rounded-full px-4 py-2 text-sm font-semibold ${statusBadge(
                          displayStatus
                        )}`}
                      >
                        {displayStatus}
                      </span>

                      {!bestMatch && lead.status === "NEW" && (
                        <p className="mt-3 text-sm text-[#667085]">
                          Waiting for admin matching.
                        </p>
                      )}

                      {bestMatch?.status === "PENDING" && (
                        <p className="mt-3 text-sm text-yellow-700">
                          Your match is waiting for admin approval.
                        </p>
                      )}

                      {bestMatch?.status === "ACTIVE" && (
                        <p className="mt-3 text-sm text-green-600">
                          A professional has been assigned to your request.
                        </p>
                      )}

                      {bestMatch?.status === "CONTACTED" && (
                        <p className="mt-3 text-sm text-purple-600">
                          The professional has contacted you. Check Messages.
                        </p>
                      )}

                      {bestMatch?.status === "COMPLETED" && (
                        <p className="mt-3 text-sm text-emerald-600">
                          This request has been completed.
                        </p>
                      )}
                    </div>
                  </div>

                  {bestMatch && (
                    <div className="mt-6 rounded-[22px] border border-[#E4E7EC] bg-[#F8F9FA] p-5">
                      <p className="text-sm font-semibold uppercase tracking-wide text-[#667085]">
                        Assigned Professional
                      </p>

                      <div className="mt-3 grid gap-4 md:grid-cols-[1.3fr_1fr_1fr]">
                        <div>
                          <p className="text-[18px] font-bold text-[#0F2340]">
                            {bestMatch.professional.user.fullName ||
                              "Professional"}
                          </p>
                          <p className="mt-1 text-sm text-[#667085]">
                            {bestMatch.professional.companyName ||
                              "Independent"}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-[#667085]">
                            Type
                          </p>
                          <p className="mt-1 text-sm font-semibold text-[#0F2340]">
                            {bestMatch.professional.professionalType.replaceAll(
                              "_",
                              " "
                            )}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-[#667085]">
                            Match Score
                          </p>
                          <p className="mt-1 text-sm font-bold text-[#C9A227]">
                            {bestMatch.score}%
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}