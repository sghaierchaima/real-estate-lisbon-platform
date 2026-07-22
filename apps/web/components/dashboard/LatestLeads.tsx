"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, Eye, Mail, MoreHorizontal, Phone } from "lucide-react";
import Link from "next/link";
import { getToken } from "@/lib/session";
import { getLeads, Lead } from "@/lib/leads-api";

function badgeClasses(value: string) {
  if (value === "HOT") return "bg-red-50 text-red-500";
  if (value === "WARM") return "bg-orange-50 text-orange-500";
  if (value === "COLD") return "bg-blue-50 text-blue-500";
  if (value === "CONTACTED") return "bg-purple-50 text-purple-600";
  if (value === "MATCHED") return "bg-green-50 text-green-600";
  return "bg-blue-50 text-blue-600";
}

function initials(name?: string | null, email?: string | null) {
  return name?.charAt(0).toUpperCase() || email?.charAt(0).toUpperCase() || "L";
}

export default function LatestLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);

  useEffect(() => {
    const loadLeads = async () => {
      const token = getToken();
      if (!token) return;

      try {
        const data = await getLeads(token);
        setLeads(data.slice(0, 5));
      } catch {
        setLeads([]);
      }
    };

    loadLeads();
  }, []);

  return (
    <div className="overflow-hidden rounded-[28px] border border-[#E9EDF3] bg-white shadow-[0_8px_24px_rgba(15,35,64,0.05)]">
      <div className="flex items-center justify-between border-b border-[#EEF2F6] px-7 py-6">
        <div>
          <h3 className="text-[20px] font-semibold tracking-[-0.02em] text-[#0F2340]">
            Latest Leads
          </h3>
          <p className="mt-1 text-[15px] text-gray-500">
            Most recent incoming buyer leads
          </p>
        </div>

        <Link
          href="/dashboard/leads"
          className="inline-flex items-center gap-2 rounded-2xl border border-[#E5EAF1] bg-white px-4 py-2.5 text-[15px] font-medium text-[#1B365D] transition hover:bg-[#F8FAFC]"
        >
          View All
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-[#EEF2F6] text-left text-[13px] uppercase tracking-[0.08em] text-gray-500">
              <th className="px-7 py-5 font-semibold">Lead</th>
              <th className="px-7 py-5 font-semibold">Source</th>
              <th className="px-7 py-5 font-semibold">Budget</th>
              <th className="px-7 py-5 font-semibold">Quality</th>
              <th className="px-7 py-5 font-semibold">Status</th>
              <th className="px-7 py-5 text-right font-semibold">Actions</th>
            </tr>
          </thead>

          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id} className="border-b border-[#F4F6F8] last:border-b-0">
                <td className="px-7 py-5">
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[linear-gradient(to_bottom_right,#1B365D,#C9A227)] text-[16px] font-semibold text-white">
                      {initials(lead.fullName, lead.email)}
                    </div>
                    <div>
                      <p className="text-[17px] font-semibold text-[#0F2340]">
                        {lead.fullName || "Unnamed lead"}
                      </p>
                      <p className="text-[14px] text-gray-500">{lead.email}</p>
                    </div>
                  </div>
                </td>

                <td className="px-7 py-5">
                  <p className="text-[16px] font-medium text-[#0F2340]">
                    {lead.source || "-"}
                  </p>
                  <p className="text-[14px] text-gray-500">
                    {new Date(lead.createdAt).toLocaleDateString()}
                  </p>
                </td>

                <td className="px-7 py-5 text-[16px] font-medium text-[#0F2340]">
                  {lead.budget || "-"}
                </td>

                <td className="px-7 py-5">
                  <span className={`rounded-full px-3 py-1 text-[13px] font-semibold ${badgeClasses(lead.quality)}`}>
                    {lead.quality}
                  </span>
                </td>

                <td className="px-7 py-5">
                  <span className={`rounded-full px-3 py-1 text-[13px] font-semibold ${badgeClasses(lead.status)}`}>
                    {lead.status}
                  </span>
                </td>

                <td className="px-7 py-5">
                  <div className="flex items-center justify-end gap-4 text-[#1B365D]">
                    <Eye className="h-5 w-5" />
                    <Mail className="h-5 w-5" />
                    <Phone className="h-5 w-5" />
                    <MoreHorizontal className="h-5 w-5" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {leads.length === 0 && (
          <div className="p-8 text-center text-[#667085]">No leads yet.</div>
        )}
      </div>
    </div>
  );
}