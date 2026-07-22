import { apiFetch } from "./api";

export type DashboardStats = {
  users: {
    total: number;
    buyers: number;
    professionals: number;
  };

  properties: {
    total: number;
  };

  leads: {
    total: number;
    hot: number;
    matched: number;
  };

  matching: {
    total: number;
    pending: number;
    active: number;
    contacted: number;
    completed: number;
    cancelled: number;
  };

  stories: {
    pending: number;
    approved: number;
  };
};

export function getDashboardStats(token: string) {
  return apiFetch<DashboardStats>("/stats/dashboard", { token });
} 

export type ProfessionalDashboardStats = {
  profile: {
    id: string;
    professionalType: string;
    verificationStatus: string;
    profileCompletion: number;
    isPropertyAgent: boolean;
  } | null;

  matches: {
    total: number;
    pending: number;
    active: number;
    contacted: number;
    completed: number;
    cancelled: number;
  };

  properties: {
    total: number;
    published: number;
    draft: number;
  };

  notifications: {
    unread: number;
  };
};

export type BuyerDashboardStats = {
  leads: {
    total: number;
    hot: number;
  };

  matches: {
    total: number;
    pending: number;
    active: number;
    contacted: number;
    completed: number;
  };

  notifications: {
    unread: number;
  };
};



export type RecentActivityItem = {
  id: string;
  type: "LEAD" | "MATCH" | "PROPERTY";
  title: string;
  description: string;
  createdAt: string;
};

export function getRecentActivity(token: string) {
  return apiFetch<RecentActivityItem[]>("/stats/recent-activity", { token });
}
export function getProfessionalDashboardStats(token: string) {
  return apiFetch<ProfessionalDashboardStats>(
    "/stats/professional-dashboard",
    { token }
  );
}

export function getBuyerDashboardStats(token: string) {
  return apiFetch<BuyerDashboardStats>(
    "/stats/buyer-dashboard",
    { token }
  );
}
export type AnalyticsDashboard = {
  totals: {
    leads: number;
    matchedLeads: number;
    matches: number;
    professionals: number;
    activeProfessionals: number;
    averageMatchScore: number;
    conversionRate: number;
    completionRate: number;
  };

  leadsQuality: {
    hot: number;
    warm: number;
    cold: number;
  };

  matchesStatus: {
    pending: number;
    active: number;
    contacted: number;
    completed: number;
    cancelled: number;
  };

  leadsBySource: {
    source: string;
    total: number;
  }[];

  matchesByStatus: {
    status: string;
    total: number;
  }[];

  topProfessionals: {
    id: string;
    name: string;
    companyName: string | null;
    professionalType: string;
    rating: number;
    completedMatches: number;
    verificationStatus: string;
  }[];
};

export function getAnalyticsDashboard(token: string) {
  return apiFetch<AnalyticsDashboard>('/stats/analytics', { token });
}