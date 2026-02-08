import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Plus, Trash2, AlertTriangle, 
  FileText, Users, Gift as GiftIcon, Download, Search, CheckCircle, XCircle, Loader2
} from 'lucide-react';
import { Layout } from '../components/Layout';
import { MOCK_RULES, GIFT_LIBRARY, STATUS_CONFIG, DEFAULT_RULE_TEMPLATE, ACTIVITIES, WHITELIST_IMPORT_TEMPLATE, DEMO_RULES } from '../constants';
import { RuleSet, RuleStatus, GiftConfigItem, SubsidyType, GiftPO } from '../types';

type RuleTextSection = {
  title: string;
  items: { title: string; content: string }[];
};

type RuleTextConfig = {
  sections: RuleTextSection[];
};

const DEFAULT_RULE_TEXT: RuleTextConfig = {
  sections: [
    {
      title: '活动介绍',
      items: [
        { title: '介绍内容标题', content: '请填写活动介绍的详细说明。' },
        { title: '介绍内容标题', content: '请补充活动背景、权益说明等内容。' },
      ],
    },
    {
      title: '注意事项',
      items: [
        { title: '物流信息', content: 'Ag端点击页面查询物流；预计 5-7 天送达。' },
      ],
    },
    {
      title: '付款方式',
      items: [
        { title: '付款方式小标题示意', content: '请填写补贴方式与自付说明。' },
      ],
    },
  ],
};

// Internal Toast Component
const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-10 left-1/2 transform -translate-x-1/2 z-[100] px-6 py-4 rounded-lg shadow-2xl flex items-center space-x-3 transition-all animate-in fade-in slide-in-from-top-4 border ${
      type === 'success' ? 'bg-slate-900 text-white border-slate-700' : 'bg-red-600 text-white border-red-700'
    }`}>
      {type === 'success' ? <CheckCircle className="w-6 h-6 text-green-400" /> : <XCircle className="w-6 h-6 text-white" />}
      <span className="font-bold text-base">{message}</span>
    </div>
  );
};

export const RuleDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<0 | 1 | 2>(0);
  
  // Rule State
  const [rule, setRule] = useState<RuleSet | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false); // Button Loading State

  // UI State
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  // Modal
  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
  const [giftSearch, setGiftSearch] = useState('');
  const [selectedWhitelistIds, setSelectedWhitelistIds] = useState<string[]>([]);
  const [openActivityIndex, setOpenActivityIndex] = useState<number | null>(null);
  const [ruleTextConfig, setRuleTextConfig] = useState<RuleTextConfig>(DEFAULT_RULE_TEXT);

  const normalizeStatus = (r: RuleSet): RuleSet => {
    const nowDate = new Date();
    const start = new Date(r.year, r.month - 1, 1, 0, 0, 0);
    const end = new Date(r.year, r.month, 1, 0, 0, 0);
    if (r.status === RuleStatus.PUBLISHED && nowDate >= start && nowDate < end) {
      return { ...r, status: RuleStatus.ACTIVE };
    }
    if ((r.status === RuleStatus.PUBLISHED || r.status === RuleStatus.ACTIVE) && nowDate >= end) {
      return { ...r, status: RuleStatus.ENDED };
    }
    return r;
  };

  // --- Initialization ---
  useEffect(() => {
    const loadData = () => {
      let allRules = MOCK_RULES;
      try {
        const saved = localStorage.getItem('GIFT_RULES');
        if (saved) {
          allRules = JSON.parse(saved);
          const merged = [...allRules];
          DEMO_RULES.forEach(d => {
            if (!merged.some(r => r.id === d.id)) merged.unshift(d);
          });
          allRules = merged;
          localStorage.setItem('GIFT_RULES', JSON.stringify(merged));
        }
      } catch (e) {
        console.error("Localstorage error", e);
      }

      // Loose comparison to handle string/number ID mismatch
      // eslint-disable-next-line eqeqeq
      const found = allRules.find(r => r.id == id);
      
      if (found) {
        const cloned = JSON.parse(JSON.stringify(found));
        cloned.giftConfigs = (cloned.giftConfigs || []).map((g: GiftConfigItem) => ({
          ...g,
          activityScope: g.activityScope && g.activityScope.length > 0 ? g.activityScope : []
        }));
        const normalized = normalizeStatus(cloned);
        setRule(normalized);
        if (normalized.status !== cloned.status) {
          persistChange(normalized);
        }
      } else {
        alert("未找到该规则，ID: " + id);
        navigate('/');
      }
      setLoading(false);
    };
    loadData();
  }, [id, navigate]);

  useEffect(() => {
    if (!rule) return;
    try {
      const parsed = JSON.parse(rule.ruleText || '');
      if (parsed && parsed.sections) {
        setRuleTextConfig(parsed as RuleTextConfig);
        return;
      }
    } catch {
      // fallback to default
    }
    setRuleTextConfig(DEFAULT_RULE_TEXT);
  }, [rule]);

  useEffect(() => {
    if (openActivityIndex === null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenActivityIndex(null);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [openActivityIndex]);

  if (loading || !rule) return <Layout><div className="p-10 text-center text-slate-500">正在加载数据...</div></Layout>;

  // --- Helpers ---
  const isLocked = rule.status === RuleStatus.ACTIVE;
  const isEnded = rule.status === RuleStatus.ENDED;
  const isTabLocked = (tabIndex: number) => {
    if (isEnded) return true;
    if (tabIndex === 0) return isLocked; 
    return false;
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };

  const persistChange = (updatedRule: RuleSet) => {
    console.log("Saving to localStorage:", updatedRule);
    try {
      const saved = localStorage.getItem('GIFT_RULES');
      const allRules: RuleSet[] = saved ? JSON.parse(saved) : MOCK_RULES;
      updatedRule.updatedAt = new Date().toLocaleString();

      // eslint-disable-next-line eqeqeq
      const index = allRules.findIndex(r => r.id == updatedRule.id);
      
      const newRules = [...allRules];
      if (index >= 0) newRules[index] = updatedRule;
      else newRules.push(updatedRule);
      
      localStorage.setItem('GIFT_RULES', JSON.stringify(newRules));
      return true;
    } catch (e) {
      console.error("Persist Error:", e);
      showToast("系统错误：无法写入本地存储", 'error');
      return false;
    }
  };

  const updateRule = (updates: Partial<RuleSet>) => {
    setRule(prev => {
      if (!prev) return null;
      return { ...prev, ...updates };
    });
  };

  // --- Logic ---
  const handleAddGift = (po: GiftPO) => {
    const newItem: GiftConfigItem = {
      sku: po.sku,
      giftName: po.name,
      price: po.price,
      activityScope: [],
      subsidyType: SubsidyType.FIXED,
      subsidyValue: 0,
      quota: 1
    };
    updateRule({ giftConfigs: [...rule.giftConfigs, newItem] });
    setIsGiftModalOpen(false);
    showToast(`已添加：${po.name}`, 'success');
  };

  const handleRemoveGift = (index: number) => {
    const newConfigs = [...rule.giftConfigs];
    newConfigs.splice(index, 1);
    updateRule({ giftConfigs: newConfigs });
  };

  const handleUpdateGift = (index: number, field: keyof GiftConfigItem, value: any) => {
    const newConfigs = [...rule.giftConfigs];
    newConfigs[index] = { ...newConfigs[index], [field]: value };
    updateRule({ giftConfigs: newConfigs });
  };

  const toggleActivity = (index: number, activityId: string) => {
    const current = rule.giftConfigs[index].activityScope || [];
    let next = current.slice();
    if (next.includes(activityId)) {
      next = next.filter(a => a !== activityId);
    } else {
      next.push(activityId);
    }
    handleUpdateGift(index, 'activityScope', next);
  };

  const calculateSelfPay = (item: GiftConfigItem) => {
    const subsidy = item.subsidyType === SubsidyType.FIXED 
      ? item.subsidyValue 
      : (item.price * item.subsidyValue) / 100;
    return Math.max(0, item.price - subsidy).toFixed(2);
  };

  const validateGiftConfig = (): string | null => {
    if (!rule.giftConfigs || rule.giftConfigs.length === 0) return '请至少添加一个礼品配置';
    const seen = new Map<string, Set<string>>();
    for (const item of rule.giftConfigs) {
      if (item.subsidyType === SubsidyType.FIXED && (item.subsidyValue < 0 || item.subsidyValue > item.price)) {
        return `${item.giftName} 补贴金额不合法`;
      }
      if (item.subsidyType === SubsidyType.PERCENTAGE && (item.subsidyValue < 0 || item.subsidyValue > 100)) {
        return `${item.giftName} 补贴比例不合法`;
      }
      const key = item.sku;
      if (!seen.has(key)) seen.set(key, new Set());
      const set = seen.get(key)!;
      for (const act of item.activityScope) {
        if (set.has(act)) {
          return `${item.giftName} 的适用活动重复`;
        }
      }
      item.activityScope.forEach(act => set.add(act));
    }
    return null;
  };

  // --- CRITICAL ACTIONS ---

  const handleSaveDraft = () => {
    if (persistChange(rule)) {
      showToast("✅ 草稿已保存", 'success');
      setTimeout(() => navigate('/'), 800);
    }
  };

  const handlePublish = async () => {
    console.log(">>> 点击了保存并上架");
    setIsSubmitting(true);

    try {
      // 0. Force a tiny delay to ensure React state updates are flushed if any
      await new Promise(resolve => setTimeout(resolve, 300));

      // 1. Gift Validation
      const giftError = validateGiftConfig();
      if (giftError) {
        showToast(`⚠️ 校验失败：${giftError}`, 'error');
        setActiveTab(0);
        setIsSubmitting(false);
        return;
      }

      // 2. Subsidy Validation
      for (const item of rule.giftConfigs) {
        const subsidy = item.subsidyType === SubsidyType.FIXED 
           ? item.subsidyValue 
           : (item.price * item.subsidyValue / 100);
        
        if (subsidy > item.price) {
            showToast(`⚠️ 校验失败：${item.giftName} 补贴金额不能超过原价`, 'error');
            setActiveTab(0);
            setIsSubmitting(false);
            return;
        }
      }

      // 4. Execute Publish (No window.confirm to avoid blocking)
      console.log("Validation passed. Publishing...");
      const updated = { ...rule, status: RuleStatus.PUBLISHED };
      setRule(updated); // Optimistic update
      
      if (persistChange(updated)) {
        showToast("🚀 上架成功！正在返回列表...", 'success');
        setTimeout(() => {
           navigate('/');
        }, 1500);
      } else {
        setIsSubmitting(false);
      }

    } catch (err: any) {
      console.error("Publish Exception:", err);
      alert("上架过程发生异常: " + err.message);
      setIsSubmitting(false);
    }
  };

  const handleUnpublish = () => {
    const nowDate = new Date();
    const start = new Date(rule.year, rule.month - 1, 1, 0, 0, 0);
    if (nowDate >= start) {
      showToast("已到生效时间，禁止下架", 'error');
      return;
    }
    if (window.confirm("确定要下架吗？")) {
      const updated = { ...rule, status: RuleStatus.DRAFT };
      setRule(updated);
      persistChange(updated);
      showToast("已下架，转为草稿", 'success');
    }
  };

  const handleSaveRuleText = () => {
    const updated = { ...rule, ruleText: JSON.stringify(ruleTextConfig) };
    if (persistChange(updated)) {
      setRule(updated);
      showToast('规则文案已更新', 'success');
    }
  };

  const handleSaveWhitelist = () => {
    if (persistChange(rule)) {
      showToast('白名单已更新', 'success');
    }
  };

  const handleWhitelistImport = () => {
    const existingJobIds = new Set(rule.whitelist.map(w => w.jobId));
    const randomCount = 5;
    const appended = Array.from({ length: randomCount }, () => {
      let jobId = '';
      do {
        jobId = `A${Math.floor(1000 + Math.random() * 9000)}`;
      } while (existingJobIds.has(jobId));
      existingJobIds.add(jobId);
      return {
        id: `E${Date.now()}${Math.random().toString(16).slice(2, 6)}`,
        name: '营销员',
        jobId,
        department: '-',
        addedAt: new Date().toLocaleDateString()
      };
    });
    updateRule({ whitelist: [...rule.whitelist, ...appended] });
    showToast(`已随机导入 ${appended.length} 人`, 'success');
  };

  const handleDownloadWhitelistTemplate = () => {
    const blob = new Blob([WHITELIST_IMPORT_TEMPLATE], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'whitelist_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const statusMeta = STATUS_CONFIG[rule.status];

  return (
    <Layout>
      {openActivityIndex !== null && !isTabLocked(0) && rule.giftConfigs[openActivityIndex] && (
        <div className="fixed inset-0 z-50 bg-slate-900/30 flex items-center justify-center" onClick={() => setOpenActivityIndex(null)}>
          <div className="bg-white border border-slate-200 rounded-xl shadow-xl p-4 w-[360px]" onClick={(e) => e.stopPropagation()}>
            <div className="text-sm font-semibold text-slate-900 mb-3">选择适用活动（可多选）</div>
            <div className="space-y-1 max-h-[300px] overflow-y-auto">
              {ACTIVITIES.map(a => {
                const item = rule.giftConfigs[openActivityIndex];
                const checked = item.activityScope.includes(a.id);
                const disabled = false;
                return (
                  <label key={a.id} className={`flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-slate-50 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={disabled}
                      onChange={() => toggleActivity(openActivityIndex, a.id)}
                    />
                    <span>{a.name}</span>
                  </label>
                );
              })}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                className="px-3 py-1.5 text-sm border border-slate-300 rounded-md hover:bg-slate-50"
                onClick={() => setOpenActivityIndex(null)}
              >
                完成
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6 sticky top-0 z-40">
        {rule.status === RuleStatus.PUBLISHED && (
          <div className="mb-4 flex items-center text-sm text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-md">
            <AlertTriangle className="w-4 h-4 mr-2" />
            当前规则已上架，修改保存后无需重新发布，请谨慎操作。
          </div>
        )}
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            <button onClick={() => navigate('/')} className="mr-4 p-2 hover:bg-slate-100 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-500" />
            </button>
            <div>
              <div className="flex items-center space-x-3 mb-1">
                <h1 className="text-2xl font-bold text-slate-900">
                  {rule.branchName} - {rule.year}/{String(rule.month).padStart(2, '0')}
                </h1>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${statusMeta.color}`}>
                  <span className="mr-1">{statusMeta.icon}</span>
                  {statusMeta.label}
                </span>
              </div>
              <p className="text-sm text-slate-500">ID: {rule.id}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
             {rule.status === RuleStatus.DRAFT && (
               <>
                 <button 
                   onClick={handleSaveDraft} 
                   disabled={isSubmitting}
                   className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors disabled:opacity-50"
                 >
                   保存草稿
                 </button>
                 <button 
                   onClick={handlePublish} 
                   disabled={isSubmitting}
                   className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover font-medium shadow-md shadow-primary/20 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                 >
                   {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                   {isSubmitting ? '正在提交...' : '保存并上架'}
                 </button>
               </>
             )}

             {rule.status === RuleStatus.PUBLISHED && (
               <>
                 <button onClick={handleUnpublish} className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 font-medium transition-colors">
                   下架
                 </button>
                 <button onClick={() => persistChange(rule) && showToast('修改已保存', 'success')} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover font-medium shadow-md shadow-primary/20 transition-colors">
                   保存修改
                 </button>
               </>
             )}

             {rule.status === RuleStatus.ACTIVE && (
                <div className="text-sm text-amber-600 bg-amber-50 px-3 py-1.5 rounded-md border border-amber-200 flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  配置已锁定
                </div>
             )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-slate-200">
        <nav className="flex space-x-8">
          {[
            { id: 0, name: '礼品分摊配置', icon: GiftIcon },
            { id: 1, name: '规则文案', icon: FileText },
            { id: 2, name: '资格白名单', icon: Users },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 0|1|2)}
              className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <tab.icon className={`-ml-0.5 mr-2 h-5 w-5 ${activeTab === tab.id ? 'text-primary' : 'text-slate-400 group-hover:text-slate-500'}`} />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 min-h-[500px]">
        
        {/* TAB 0: GIFT CONFIG */}
        {activeTab === 0 && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div className="text-sm text-slate-500">
                每月仅可配置一个礼品，删除后可重新添加。
              </div>
              <button 
                onClick={() => setIsGiftModalOpen(true)}
                disabled={isTabLocked(0) || rule.giftConfigs.length >= 1}
                className="flex items-center px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors shadow-lg shadow-slate-200"
              >
                <Plus className="w-4 h-4 mr-2" />
                {rule.giftConfigs.length >= 1 ? '已添加礼品' : '添加礼品'}
              </button>
            </div>

            {/* Gift Table */}
            <div className="overflow-x-auto overflow-y-visible border rounded-lg border-slate-200">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">礼品详情</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">原价</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">适用活动</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">分摊方式</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">补贴额度</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">自付金额</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">限额</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">操作</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {rule.giftConfigs.map((item, index) => (
                    <tr key={index} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                         <div className="flex flex-col">
                            <span className="font-medium text-slate-900">{item.giftName}</span>
                            <span className="text-xs text-slate-500">{item.sku}</span>
                         </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">¥{item.price.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          disabled={isTabLocked(0)}
                          onClick={() => setOpenActivityIndex(index)}
                          className="w-40 text-left text-sm border border-slate-300 rounded-md shadow-sm px-3 py-1.5 bg-white disabled:bg-slate-100"
                        >
                          {item.activityScope.length === 0
                            ? '适用所有活动'
                            : item.activityScope
                                .map(id => ACTIVITIES.find(a => a.id === id)?.name || id)
                                .join(', ')}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <select 
                           value={item.subsidyType}
                           onChange={(e) => handleUpdateGift(index, 'subsidyType', e.target.value)}
                           disabled={isTabLocked(0)}
                           className="text-sm border-slate-300 rounded-md shadow-sm w-28 disabled:bg-slate-100"
                        >
                          <option value={SubsidyType.FIXED}>固定金额</option>
                          <option value={SubsidyType.PERCENTAGE}>比例(%)</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <div className="relative rounded-md shadow-sm w-24">
                          <input
                            type="number"
                            value={item.subsidyValue}
                            onChange={(e) => handleUpdateGift(index, 'subsidyValue', parseFloat(e.target.value))}
                            disabled={isTabLocked(0)}
                            className="block w-full rounded-md border-slate-300 pl-3 pr-8 focus:border-primary sm:text-sm disabled:bg-slate-100"
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                            <span className="text-slate-500 sm:text-sm">
                              {item.subsidyType === SubsidyType.FIXED ? '¥' : '%'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                         <span className="text-sm font-bold text-primary">¥{calculateSelfPay(item)}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                         <input
                            type="number"
                            value={item.quota || ''}
                            onChange={(e) => handleUpdateGift(index, 'quota', parseInt(e.target.value))}
                            disabled={isTabLocked(0)}
                            className="w-16 text-center text-sm border-slate-300 rounded-md disabled:bg-slate-100"
                            placeholder="-"
                          />
                      </td>
                      <td className="px-4 py-3 text-right">
                         <button onClick={() => handleRemoveGift(index)} disabled={isTabLocked(0)} className="text-slate-400 hover:text-red-500 disabled:opacity-30">
                           <Trash2 className="w-4 h-4" />
                         </button>
                      </td>
                    </tr>
                  ))}
                  {rule.giftConfigs.length === 0 && (
                    <tr>
                       <td colSpan={8} className="px-6 py-12 text-center text-slate-400 text-sm flex flex-col items-center justify-center">
                          <GiftIcon className="w-8 h-8 mb-2 text-slate-300" />
                          暂无礼品配置，请点击右上角“添加礼品”
                       </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 1: TEXT PREVIEW */}
        {activeTab === 1 && (
          <div className="p-6 h-[640px] flex gap-8">
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="text-sm font-medium text-slate-700 mb-4">规则文案配置（按字段）</div>
              <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                {ruleTextConfig.sections.map((section, sectionIndex) => (
                  <div key={section.title} className="bg-white border border-slate-200 rounded-xl p-4">
                    <div className="text-sm font-semibold text-slate-800 mb-3">{section.title}</div>
                    <div className="space-y-4">
                      {section.items.map((item, itemIndex) => (
                        <div key={`${section.title}-${itemIndex}`} className="grid grid-cols-[140px_1fr] gap-4 items-start">
                          <div className="text-xs font-semibold text-slate-500 pt-2">{item.title}</div>
                          <textarea
                            value={item.content}
                            onChange={(e) => {
                              const next = { ...ruleTextConfig };
                              next.sections = next.sections.map((s, si) => {
                                if (si !== sectionIndex) return s;
                                return {
                                  ...s,
                                  items: s.items.map((it, ii) => ii === itemIndex ? { ...it, content: e.target.value } : it)
                                };
                              });
                              setRuleTextConfig(next);
                            }}
                            className="w-full min-h-[72px] p-3 border border-slate-300 rounded-lg text-sm focus:ring-primary focus:border-primary resize-vertical"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  onClick={handleSaveRuleText}
                  className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary-hover"
                >
                  保存规则文案
                </button>
              </div>
            </div>
            {/* C-端预览 */}
            <div className="w-[340px] bg-slate-900 rounded-[2rem] p-3 shadow-2xl relative border-4 border-slate-800 flex-shrink-0">
              <div className="bg-white rounded-[1.5rem] h-full overflow-hidden flex flex-col relative">
                <div className="h-10 border-b flex items-center justify-center font-semibold text-slate-800 text-sm">申请WSM礼品</div>
                <div className="flex-1 p-4 overflow-y-auto space-y-4">
                  <div className="text-xs text-slate-500 flex items-center">
                    <span className="inline-block w-1 h-4 bg-primary rounded mr-2" />
                    申请前，请先阅读礼品申请介绍
                  </div>
                  {ruleTextConfig.sections.map((section) => (
                    <div key={section.title} className={`p-3 rounded-2xl ${section.title === '活动介绍' ? 'bg-rose-50 border border-rose-100' : ''}`}>
                      <div className="text-sm font-semibold text-slate-800 mb-2">{section.title}</div>
                      <div className="space-y-3">
                        {section.items.map((item, idx) => (
                          <div key={`${section.title}-preview-${idx}`} className="text-xs text-slate-600 leading-relaxed">
                            <div className="font-semibold text-slate-700 mb-1">{idx + 1}. {item.title}</div>
                            <div>{item.content}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4 border-t">
                  <button className="w-full bg-primary text-white py-2 rounded-full text-sm font-bold shadow-lg shadow-red-200">同意并继续申请</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: WHITELIST */}
        {activeTab === 2 && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div className="text-sm font-medium text-slate-500">
                当前白名单人数: <span className="text-slate-900 font-bold text-lg">{rule.whitelist.length}</span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleDownloadWhitelistTemplate}
                  className="flex items-center px-3 py-1.5 border border-slate-300 rounded-md text-sm hover:bg-slate-50"
                >
                  <Download className="w-4 h-4 mr-2" /> 下载模板
                </button>
                <button
                  onClick={handleWhitelistImport}
                  className="flex items-center px-3 py-1.5 bg-slate-900 text-white rounded-md text-sm hover:bg-slate-800"
                >
                  <Users className="w-4 h-4 mr-2" /> 批量导入
                </button>
                <button
                  onClick={() => {
                    if (selectedWhitelistIds.length === 0) return;
                    const remaining = rule.whitelist.filter(w => !selectedWhitelistIds.includes(w.id));
                    updateRule({ whitelist: remaining });
                    setSelectedWhitelistIds([]);
                  }}
                  className="flex items-center px-3 py-1.5 border border-slate-300 rounded-md text-sm hover:bg-slate-50"
                >
                  批量移除
                </button>
                 <button onClick={() => updateRule({whitelist: []})} className="flex items-center px-3 py-1.5 border border-red-200 text-red-600 rounded-md text-sm hover:bg-red-50">
                  清空名单
                </button>
              </div>
            </div>
            <div className="bg-white border rounded-lg overflow-hidden">
               <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                        <input
                          type="checkbox"
                          checked={rule.whitelist.length > 0 && rule.whitelist.every(w => selectedWhitelistIds.includes(w.id))}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedWhitelistIds(rule.whitelist.map(w => w.id));
                            } else {
                              setSelectedWhitelistIds([]);
                            }
                          }}
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">工号</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">导入时间</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {rule.whitelist.map((agent, i) => (
                      <tr key={agent.id + i}>
                        <td className="px-4 py-3 text-sm text-slate-500">
                          <input
                            type="checkbox"
                            checked={selectedWhitelistIds.includes(agent.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedWhitelistIds(prev => [...prev, agent.id]);
                              } else {
                                setSelectedWhitelistIds(prev => prev.filter(id => id !== agent.id));
                              }
                            }}
                          />
                        </td>
                        <td className="px-6 py-3 text-sm text-slate-500">{agent.jobId}</td>
                        <td className="px-6 py-3 text-sm text-slate-500">{agent.addedAt}</td>
                      </tr>
                    ))}
                    {rule.whitelist.length === 0 && (
                       <tr><td colSpan={3} className="px-6 py-12 text-center text-slate-400">暂无白名单数据</td></tr>
                    )}
                  </tbody>
               </table>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleSaveWhitelist}
                className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary-hover"
              >
                保存白名单
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Gift Modal */}
      {isGiftModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-[100] backdrop-blur-sm animate-in fade-in">
           <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[80vh]">
              <div className="p-4 border-b flex justify-between items-center">
                 <h3 className="font-bold text-lg">选择礼品 (PO)</h3>
                 <button onClick={() => setIsGiftModalOpen(false)} className="text-slate-400 hover:text-slate-600">×</button>
              </div>
              <div className="p-4 border-b bg-slate-50">
                 <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="搜索 SKU 或礼品名称..." 
                      className="w-full pl-9 pr-4 py-2 border rounded-md text-sm focus:ring-primary focus:border-primary"
                      value={giftSearch}
                      onChange={e => setGiftSearch(e.target.value)}
                    />
                 </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                 {GIFT_LIBRARY.filter(g => g.name.toLowerCase().includes(giftSearch.toLowerCase()) || g.sku.includes(giftSearch)).map(gift => (
                    <div key={gift.id} className="flex items-center p-3 border rounded-lg hover:border-primary cursor-pointer transition-colors group" onClick={() => handleAddGift(gift)}>
                       <img src={gift.imageUrl} alt={gift.name} className="w-12 h-12 rounded object-cover mr-4 bg-slate-200" />
                       <div className="flex-1">
                          <h4 className="font-medium text-slate-900 group-hover:text-primary">{gift.name}</h4>
                          <p className="text-xs text-slate-500">{gift.sku}</p>
                       </div>
                       <div className="font-bold text-slate-700">¥{gift.price.toFixed(2)}</div>
                       <Plus className="ml-4 text-slate-300 group-hover:text-primary" />
                    </div>
                 ))}
              </div>
           </div>
        </div>
      )}
    </Layout>
  );
};
