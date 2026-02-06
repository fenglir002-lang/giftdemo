export enum RuleStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ACTIVE = 'ACTIVE',
  ENDED = 'ENDED'
}

export enum SubsidyType {
  FIXED = 'FIXED',
  PERCENTAGE = 'PERCENTAGE'
}

export interface GiftPO {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  sku: string;
}

export interface GiftConfigItem {
  sku: string;
  giftName: string; // Cached for display
  price: number; // Cached PO Price
  activityScope: string[]; // ['GENERAL'] or specific IDs
  subsidyType: SubsidyType;
  subsidyValue: number; // Amount or Percentage
  quota: number | undefined; // Per person limit for this specific gift
}

export interface Employee {
  id: string;
  name: string;
  jobId: string;
  department: string;
  addedAt: string;
}

export interface RuleSet {
  id: string;
  branchId: string;
  branchName: string;
  year: number;
  month: number;
  status: RuleStatus;
  monthlyQuota: number; // Global limit per person
  updatedAt: string;
  operator: string;
  
  // Tab Data
  giftConfigs: GiftConfigItem[];
  ruleText: string;
  whitelist: Employee[];
}

export interface BranchOption {
  id: string;
  name: string;
}