import { promises as fs } from "fs";
import path from "path";
import { pricing } from "./site";

export type LeadPayload = {
  name?: string;
  phoneOrEmail: string;
  gender?: string;
  favoriteMarketplace?: string;
  interest?: string;
  consent: boolean;
  createdAt: string;
};

export type LeadRecord = LeadPayload & {
  id: string;
  spotNumber: number;
  hasDiscount: boolean;
  priceAnnual: number;
  priceWithDiscount: number;
};

const dataDir = path.join(process.cwd(), "data");
const leadsFile = path.join(dataDir, "leads.json");

async function readLeads(): Promise<LeadRecord[]> {
  try {
    const raw = await fs.readFile(leadsFile, "utf-8");
    return JSON.parse(raw) as LeadRecord[];
  } catch {
    return [];
  }
}

async function writeLeads(leads: LeadRecord[]) {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(leadsFile, JSON.stringify(leads, null, 2), "utf-8");
}

export async function registerLead(payload: LeadPayload): Promise<LeadRecord> {
  const leads = await readLeads();
  const spotNumber = leads.length + 1;
  const hasDiscount = spotNumber <= pricing.firstUsersLimit;

  const record: LeadRecord = {
    ...payload,
    id: `lead_${Date.now()}_${spotNumber}`,
    spotNumber,
    hasDiscount,
    priceAnnual: pricing.annualRub,
    priceWithDiscount: hasDiscount ? pricing.discountedAnnualRub : pricing.annualRub,
  };

  leads.push(record);
  await writeLeads(leads);
  return record;
}

export async function getLeadsCount() {
  const leads = await readLeads();
  return leads.length;
}

export async function getRemainingDiscountSpots() {
  const count = await getLeadsCount();
  return Math.max(0, pricing.firstUsersLimit - count);
}
