import type { LeadStatus } from "./constants";

export interface ApiLead {
  id: number;
  businessName: string;
  contactName: string;
  contactRole: string;
  industry: string;
  city: string;
  channel: string;
  size: string;
  painPoint: string;
  score: number;
  status: LeadStatus;
  dealValue: number;
  workflowId: number | null;
  workflowName: string | null;
  workflowPrice?: number | null;
  listId: number | null;
  listName?: string | null;
  phone: string | null;
  whatsapp: string | null;
  instagram: string | null;
  website: string | null;
  address: string | null;
  source: string;
  notes: string | null;
  lastContactAt: string | null;
  createdAt: string;
}

export interface ApiWorkflow {
  id: number;
  name: string;
  description: string;
  category: string;
  price: number;
  nodes: number;
  integrations: string[];
  hoursSaved: number;
  createdAt: string;
}

export interface StatusStat {
  status: LeadStatus;
  count: number;
  value: number;
}

export interface ApiList {
  id: number;
  name: string;
  city: string | null;
  industries: string[];
  count: number;
  value: number;
  createdAt: string;
}
