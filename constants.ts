import { BranchOption, GiftPO, RuleSet, RuleStatus, SubsidyType } from './types';

// Mock Branches
export const BRANCHES: BranchOption[] = [
  { id: 'B001', name: '总公司' },
  { id: 'B002', name: '上海分公司' },
  { id: 'B003', name: '北京分公司' },
  { id: 'B004', name: '深圳分公司' },
  { id: 'B005', name: '广州分公司' },
];

// Mock Gift Library (PO)
export const GIFT_LIBRARY: GiftPO[] = [
  { id: 'G001', sku: 'SKU-2023-A01', name: '高级真空保温杯', price: 128.00, imageUrl: 'https://picsum.photos/100/100?random=1' },
  { id: 'G002', sku: 'SKU-2023-B05', name: '商务皮质笔记本套装', price: 45.00, imageUrl: 'https://picsum.photos/100/100?random=2' },
  { id: 'G003', sku: 'SKU-2023-C12', name: '无线快充充电宝', price: 89.90, imageUrl: 'https://picsum.photos/100/100?random=3' },
  { id: 'G004', sku: 'SKU-2023-D08', name: '多功能旅行双肩包', price: 159.00, imageUrl: 'https://picsum.photos/100/100?random=4' },
  { id: 'G005', sku: 'SKU-2023-E22', name: '精选茶叶礼盒', price: 299.00, imageUrl: 'https://picsum.photos/100/100?random=5' },
];

// Mock Initial Rules
export const MOCK_RULES: RuleSet[] = [
  {
    id: '10001',
    branchId: 'B002',
    branchName: '上海分公司',
    year: 2023,
    month: 10,
    status: RuleStatus.ACTIVE,
    monthlyQuota: 5,
    updatedAt: '2023-09-30 14:00',
    operator: 'Alice (SH001)',
    giftConfigs: [
      {
        sku: 'SKU-2023-A01',
        giftName: '高级真空保温杯',
        price: 128.00,
        activityScope: [],
        subsidyType: SubsidyType.FIXED,
        subsidyValue: 100,
        quota: 2
      }
    ],
    ruleText: "1. 每位营销员每月限额 5 份。\n2. 领取时请确保客户签字确认。",
    whitelist: [
      { id: 'E001', name: '张三', jobId: 'A1001', department: '销售一部', addedAt: '2023-09-28' }
    ]
  },
  {
    id: '10002',
    branchId: 'B002',
    branchName: '上海分公司',
    year: 2023,
    month: 11,
    status: RuleStatus.PUBLISHED,
    monthlyQuota: 3,
    updatedAt: '2023-10-15 09:30',
    operator: 'Bob (SH002)',
    giftConfigs: [],
    ruleText: "11月特别活动政策说明...",
    whitelist: []
  },
  {
    id: '10003',
    branchId: 'B003',
    branchName: '北京分公司',
    year: 2023,
    month: 11,
    status: RuleStatus.DRAFT,
    monthlyQuota: 0,
    updatedAt: '2023-10-20 16:45',
    operator: 'Charlie (BJ005)',
    giftConfigs: [],
    ruleText: "",
    whitelist: []
  }
];

export const DEMO_RULES: RuleSet[] = [
  {
    id: 'DEMO_ACTIVE',
    branchId: 'B004',
    branchName: '深圳分公司',
    year: 2026,
    month: 2,
    status: RuleStatus.ACTIVE,
    monthlyQuota: 6,
    updatedAt: '2026-02-01 09:00',
    operator: 'Demo (SZ001)',
    giftConfigs: [
      {
        sku: 'SKU-2023-C12',
        giftName: '无线快充充电宝',
        price: 89.90,
        activityScope: [],
        subsidyType: SubsidyType.PERCENTAGE,
        subsidyValue: 50,
        quota: 2
      }
    ],
    ruleText: '',
    whitelist: []
  },
  {
    id: 'DEMO_PUBLISHED',
    branchId: 'B003',
    branchName: '北京分公司',
    year: 2026,
    month: 3,
    status: RuleStatus.PUBLISHED,
    monthlyQuota: 4,
    updatedAt: '2026-02-05 10:30',
    operator: 'Demo (BJ001)',
    giftConfigs: [],
    ruleText: '',
    whitelist: []
  },
  {
    id: 'DEMO_ENDED',
    branchId: 'B002',
    branchName: '上海分公司',
    year: 2026,
    month: 1,
    status: RuleStatus.ENDED,
    monthlyQuota: 5,
    updatedAt: '2026-01-31 18:00',
    operator: 'Demo (SH001)',
    giftConfigs: [],
    ruleText: '',
    whitelist: []
  }
];

export const STATUS_CONFIG = {
  [RuleStatus.DRAFT]: { label: '草稿', color: 'bg-gray-100 text-gray-600 ring-gray-500/10', icon: '⚪' },
  [RuleStatus.PUBLISHED]: { label: '已上架', color: 'bg-blue-50 text-blue-700 ring-blue-700/10', icon: '🔵' },
  [RuleStatus.ACTIVE]: { label: '生效中', color: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', icon: '🔒' },
  [RuleStatus.ENDED]: { label: '已结束', color: 'bg-slate-100 text-slate-700 ring-slate-600/20', icon: '⚫' },
};

export const DEFAULT_RULE_TEMPLATE = `**礼品领取与分摊规则**

1. 资格说明：仅限白名单内的营销员参与。
2. 月度限额：您本月最多可申请 {Limit} 份礼品。
3. 费用分摊：公司将补贴部分礼品费用，您仅需支付差额部分。
4. 配送说明：礼品将于每周五统一配送至职场。

*注：具体补贴金额请以申请页显示为准。*`;

export const ACTIVITIES = [
  { id: 'ACT1001', name: '开门红启动会' },
  { id: 'ACT1002', name: '企业团建活动' },
  { id: 'ACT1003', name: '季度激励大会' },
];

export const RULE_IMPORT_TEMPLATE = `branchId,year,month,monthlyQuota
B002,2024,3,5
B003,2024,3,3`;

export const WHITELIST_IMPORT_TEMPLATE = `name,jobId,department
张三,A1001,销售一部
李四,A1002,销售二部`;
