"use client";

import { useState } from "react";
import Navbar from "@/components/web/Navbar";
import Footer from "@/components/web/Footer";
import { getToken, getStoredUser } from "@/lib/session";
import type { AuthUser } from "@/lib/auth-api";
import { createLeadFromPropertySearch } from "@/lib/leads-api";
import { useToast } from "@/components/ui/ToastProvider";
import { Search, Sparkles } from "lucide-react";
import { extractPropertySearch } from "@/lib/ai-api";
import { WandSparkles } from "lucide-react";
export default function PropertySearchAssistantPage() {
  const toast = useToast();
const [extracting, setExtracting] = useState(false);
const [mustHave, setMustHave] = useState<string[]>([]);
const [aiSummary, setAiSummary] = useState("");
  const [searchText, setSearchText] = useState("");
  const [location, setLocation] = useState("");
  const [budget, setBudget] = useState("");
  const [propertyType, setPropertyType] = useState("apartment");
  const [bedrooms, setBedrooms] = useState("");
  const [goal, setGoal] = useState("buy");
  const [saving, setSaving] = useState(false);
  const [confidence ,setConfidence] = useState<number | null>(null);


  async function handleCreateRequest() {
    const token = getToken();
    const user = getStoredUser<AuthUser>();

    if (!token || !user) {
      toast.warning("Login required", "Please sign in as a buyer.");
      return;
    }

    if (user.role !== "BUYER") {
      toast.warning("Buyer account required", "Only buyers can create requests.");
      return;
    }

    if (!searchText.trim()) {
      toast.warning("Search required", "Please describe what you are looking for.");
      return;
    }

    try {
      setSaving(true);

      const lead = await createLeadFromPropertySearch(token, {
        searchText,
        location,
        budget,
        propertyType,
        bedrooms,
        goal,
      });

      if (lead.alreadyExists) {
        toast.info(
          "Request already exists",
          "This property search request is already available in My Requests."
        );
        return;
      }

      toast.success(
        "Buyer request created",
        "Your property search request is now waiting for admin matching."
      );
    } catch (error) {
      toast.error(
        "Unable to create request",
        error instanceof Error ? error.message : "Please try again later."
      );
    } finally {
      setSaving(false);
    }
  }
  async function handleExtractWithAI() {
    
  if (!searchText.trim()) {
    toast.warning(
      "Search required",
      "Please describe what you are looking for."
    );
    return;
  }
  try {
    
    setExtracting(true);

    const extracted = await extractPropertySearch(searchText);

    setLocation(extracted.location || "");
    setBudget(extracted.budget || "");
    setPropertyType(extracted.propertyType || "apartment");
    setBedrooms(extracted.bedrooms || "");
    setGoal(extracted.goal || "buy");
    setMustHave(extracted.mustHave || []);
    setAiSummary(extracted.summary || "");
    setConfidence(extracted.confidence || null);
    toast.success(
      "Search analyzed",
      "AI extracted the key search criteria successfully."
    );
  } catch (error) {
    toast.error(
      "AI extraction failed",
      error instanceof Error ? error.message : "Please try again later."
    );
  } finally {
    setExtracting(false);
  }
}
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#F8F9FA] px-6 py-16 md:px-12">
        <div className="mx-auto max-w-[1100px]">
          <div className="mb-8">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#1B365D]">
              <Sparkles size={16} />
              AI Property Search
            </div>

            <h1 className="text-[44px] font-bold tracking-[-0.04em] text-[#0F2340]">
              Tell us what you’re looking for
            </h1>

            <p className="mt-3 max-w-[760px] text-[18px] leading-8 text-[#667085]">
              Describe your ideal property and create a buyer request that can be matched with the right professional.
            </p>
          </div>

          <div className="rounded-[28px] border border-[#E4E7EC] bg-white p-8 shadow-sm">
            <label className="mb-3 block text-sm font-semibold text-[#0F2340]">
              Describe your search
            </label>

            <textarea
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Example: I need a 3-bedroom apartment near metro in Lisbon under €550k..."
              className="min-h-[150px] w-full rounded-2xl border border-[#D0D5DD] p-5 outline-none focus:border-[#1B365D]"
            />

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Location, e.g. Lisbon"
                className="h-14 rounded-2xl border border-[#D0D5DD] px-5 outline-none focus:border-[#1B365D]"
              />

              <input
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="Budget, e.g. 550000"
                className="h-14 rounded-2xl border border-[#D0D5DD] px-5 outline-none focus:border-[#1B365D]"
              />

              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className="h-14 rounded-2xl border border-[#D0D5DD] px-5 outline-none focus:border-[#1B365D]"
              >
                <option value="apartment">Apartment</option>
                <option value="house">House</option>
                <option value="villa">Villa</option>
                <option value="penthouse">Penthouse</option>
              </select>

              <input
                value={bedrooms}
                onChange={(e) => setBedrooms(e.target.value)}
                placeholder="Bedrooms, e.g. 3"
                className="h-14 rounded-2xl border border-[#D0D5DD] px-5 outline-none focus:border-[#1B365D]"
              />

              <select
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="h-14 rounded-2xl border border-[#D0D5DD] px-5 outline-none focus:border-[#1B365D] md:col-span-2"
              >
                <option value="buy">Buy to live</option>
                <option value="invest">Investment</option>
                <option value="relocate">Relocation</option>
                <option value="retire">Retirement</option>
              </select>
            </div>

{confidence !== null && (
  <p className="mt-3 text-sm font-semibold text-[#1B365D]">
    Confidence score: {confidence}%
  </p>
)}

            
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
  <button
    type="button"
    onClick={handleExtractWithAI}
    disabled={extracting}
    className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-[#D0D5DD] bg-white px-7 font-semibold text-[#1B365D] transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-60"
  >
    <WandSparkles size={18} />
    {extracting ? "Analyzing..." : "Analyze with AI"}
  </button>

  <button
    type="button"
    onClick={handleCreateRequest}
    disabled={saving}
    className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-[#1B365D] px-7 font-semibold text-white transition hover:bg-[#0F2340] disabled:cursor-not-allowed disabled:opacity-60"
  >
    <Search size={18} />
    {saving ? "Creating request..." : "Create Buyer Request"}
  </button>
</div>
            
{mustHave.length > 0 && (
  <div className="mt-6 rounded-2xl bg-[#F8F9FA] p-5">
    <p className="font-semibold text-[#0F2340]">AI extracted priorities</p>

    <div className="mt-3 flex flex-wrap gap-2">
      {mustHave.map((item) => (
        <span
          key={item}
          className="rounded-full bg-[#FFF8E1] px-4 py-2 text-sm font-semibold text-[#8A6400]"
        >
          {item}
        </span>
      ))}
    </div>

    {aiSummary && (
      <p className="mt-4 text-sm leading-6 text-[#667085]">{aiSummary}</p>
    )}
  </div>
)}
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}