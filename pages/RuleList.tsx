import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Search, Copy, Eye, Edit3, Trash2, UploadCloud, 
  ArrowUpCircle, ArrowDownCircle, X, CheckCircle, XCircle
} from 'lucide-react';
import { Layout } from '../components/Layout';
import { MOCK_RULES, BRANCHES, STATUS_CONFIG, RULE_IMPORT_TEMPLATE, DEMO_RULES } from '../constants';
import { RuleStatus, RuleSet } from '../types';

// Internal Toast Component (Copied from RuleDetail for consistency)
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

export const RuleList: React.FC = () => {
  const navigate = useNavigate();
  
  // Initialize from LocalStorage or fallback to MOCK_RULES
  const [rules, setRules] = useState<RuleSet[]>(() => {
    try {
      const saved = localStorage.getItem('GIFT_RULES');
      const base: RuleSet[] = saved ? JSON.parse(saved) : MOCK_RULES;
      const merged = [...base];
      DEMO_RULES.forEach(d => {
        if (!merged.some(r => r.id === d.id)) merged.unshift(d);
      });
      localStorage.setItem('GIFT_RULES', JSON.stringify(merged));
      return merged;
    } catch (e) {
      console.error("Failed to load rules", e);
      const merged = [...MOCK_RULES, ...DEMO_RULES.filter(d => !MOCK_RULES.some(r => r.id === d.id))];
      return merged;
    }
  });
  
  // Date Helpers for Validation
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  // Filter Form State
  const [queryParams, setQueryParams] = useState({
    year: currentYear,
    month: '' as string | number,
    branchId: '',
    status: '',
    searchText: ''
  });

  const [activeFilters, setActiveFilters] = useState(queryParams);

  // UI State
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  // Modal State for New Rule
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRuleForm, setNewRuleForm] = useState({
    branchId: '',
    year: currentYear,
    month: currentMonth
  });

  // Modal State for Copy Rule
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [copyTarget, setCopyTarget] = useState<{ sourceId: string, year: number, month: number }>({
    sourceId: '',
    year: currentYear,
    month: currentMonth
  });

  // Modal State for Batch Import
  const [isImportOpen, setIsImportOpen] = useState(false);

  // Dynamic Options for Modal
  const availableYears = [currentYear, currentYear + 1, currentYear + 2];
  const availableMonths = newRuleForm.year === currentYear 
    ? Array.from({ length: 12 - currentMonth + 1 }, (_, i) => currentMonth + i)
    : Array.from({ length: 12 }, (_, i) => i + 1);

  // Auto-adjust month if year changes and current month becomes invalid
  useEffect(() => {
    if (newRuleForm.year === currentYear && newRuleForm.month < currentMonth) {
      setNewRuleForm(prev => ({ ...prev, month: currentMonth }));
    }
  }, [newRuleForm.year, currentYear, currentMonth]);

  // --- Helpers ---
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };

  // --- Actions ---
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

  useEffect(() => {
    const updated = rules.map(normalizeStatus);
    const changed = updated.some((r, i) => r.status !== rules[i].status);
    if (changed) {
      setRules(updated);
      localStorage.setItem('GIFT_RULES', JSON.stringify(updated));
    }
  }, [rules]);

  const handleSearch = () => {
    setActiveFilters(queryParams);
  };

  const handleReset = () => {
    const defaults = {
      year: currentYear,
      month: '',
      branchId: '',
      status: '',
      searchText: ''
    };
    setQueryParams(defaults);
    setActiveFilters(defaults);
  };

  const clearFilter = (key: keyof typeof queryParams, defaultValue: any) => {
    setQueryParams(prev => ({ ...prev, [key]: defaultValue }));
  };

  const filteredRules = rules.filter(r => {
    if (r.year !== activeFilters.year) return false;
    if (activeFilters.month && r.month !== Number(activeFilters.month)) return false;
    if (activeFilters.branchId && r.branchId !== activeFilters.branchId) return false;
    if (activeFilters.status && r.status !== activeFilters.status) return false;
    if (activeFilters.searchText) {
      const term = activeFilters.searchText.toLowerCase();
      const hasGift = r.giftConfigs.some(g => 
        g.giftName.toLowerCase().includes(term)
      );
      const isIdMatch = r.id.toLowerCase().includes(term);
      if (!hasGift && !isIdMatch) return false;
    }
    return true;
  }).sort((a, b) => {
    const aKey = a.year * 100 + a.month;
    const bKey = b.year * 100 + b.month;
    return bKey - aKey;
  });

  const handleDelete = (id: string) => {
    if (window.confirm('确定要删除这条草稿吗？')) {
      const updated = rules.filter(r => r.id !== id);
      setRules(updated);
      localStorage.setItem('GIFT_RULES', JSON.stringify(updated));
      showToast('删除成功', 'success');
    }
  };

  const handlePublishFromList = (id: string) => {
    const target = rules.find(r => r.id === id);
    if (!target) return;
    if (target.monthlyQuota <= 0 || target.giftConfigs.length === 0) {
      showToast('请先完善规则配置后再上架', 'error');
      return;
    }
    const updated = rules.map(r => r.id === id ? { ...r, status: RuleStatus.PUBLISHED, updatedAt: new Date().toLocaleString() } : r);
    setRules(updated);
    localStorage.setItem('GIFT_RULES', JSON.stringify(updated));
    showToast('已上架', 'success');
  };

  const handleUnpublishFromList = (id: string) => {
    const target = rules.find(r => r.id === id);
    if (!target) return;
    const start = new Date(target.year, target.month - 1, 1, 0, 0, 0);
    if (new Date() >= start) {
      showToast('已到生效时间，禁止下架', 'error');
      return;
    }
    const updated = rules.map(r => r.id === id ? { ...r, status: RuleStatus.DRAFT, updatedAt: new Date().toLocaleString() } : r);
    setRules(updated);
    localStorage.setItem('GIFT_RULES', JSON.stringify(updated));
    showToast('已下架，转为草稿', 'success');
  };

  const handleCreateRule = () => {
    const existing = rules.find(
      r => r.branchId === newRuleForm.branchId && r.year === newRuleForm.year && r.month === newRuleForm.month
    );

    if (existing) {
      showToast(`该分公司在 ${newRuleForm.year}年${newRuleForm.month}月 已存在规则 (ID: ${existing.id})`, 'error');
      return;
    }

    const branchName = BRANCHES.find(b => b.id === newRuleForm.branchId)?.name || '未知分公司';
    
    // Generate new ID based on max existing ID
    const maxId = rules.reduce((max, r) => Math.max(max, parseInt(r.id) || 0), 10000);
    const newId = (maxId + 1).toString();
    
    const newRule: RuleSet = {
      id: newId,
      branchId: newRuleForm.branchId,
      branchName: branchName,
      year: newRuleForm.year,
      month: newRuleForm.month,
      status: RuleStatus.DRAFT,
      monthlyQuota: 0,
      updatedAt: new Date().toLocaleString(),
      operator: '当前管理员',
      giftConfigs: [],
      ruleText: '',
      whitelist: []
    };

    const updatedRules = [newRule, ...rules];
    setRules(updatedRules);
    localStorage.setItem('GIFT_RULES', JSON.stringify(updatedRules));
    
    setIsModalOpen(false);
    navigate(`/rule/${newId}`);
  };

  const handleCopyRule = () => {
    const source = rules.find(r => r.id === copyTarget.sourceId);
    if (!source) return;
    const exists = rules.find(
      r => r.branchId === source.branchId && r.year === copyTarget.year && r.month === copyTarget.month
    );
    if (exists) {
      showToast(`目标月份已存在规则 (ID: ${exists.id})`, 'error');
      return;
    }
    const maxId = rules.reduce((max, r) => Math.max(max, parseInt(r.id) || 0), 10000);
    const newId = (maxId + 1).toString();
    const copied: RuleSet = {
      ...source,
      id: newId,
      year: copyTarget.year,
      month: copyTarget.month,
      status: RuleStatus.DRAFT,
      updatedAt: new Date().toLocaleString(),
      operator: '当前管理员'
    };
    const updated = [copied, ...rules];
    setRules(updated);
    localStorage.setItem('GIFT_RULES', JSON.stringify(updated));
    setIsCopyModalOpen(false);
    navigate(`/rule/${newId}`);
  };

  const parseCsv = (text: string) => {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) return [];
    const header = lines[0].split(',').map(h => h.trim());
    return lines.slice(1).map(line => {
      const cols = line.split(',').map(c => c.trim());
      const row: Record<string, string> = {};
      header.forEach((h, i) => { row[h] = cols[i] || ''; });
      return row;
    });
  };

  const handleImportRules = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result || '');
        const rows = parseCsv(text);
        if (rows.length === 0) {
          showToast('导入文件为空或格式不正确', 'error');
          return;
        }
        const updatedRules = [...rules];
        let created = 0;
        rows.forEach(row => {
          const branchId = row.branchId;
          const year = Number(row.year);
          const month = Number(row.month);
          const monthlyQuota = Number(row.monthlyQuota || 0);
          if (!branchId || !year || !month) return;
          const exists = updatedRules.find(r => r.branchId === branchId && r.year === year && r.month === month);
          if (exists) return;
          const branchName = BRANCHES.find(b => b.id === branchId)?.name || '未知分公司';
          const maxId = updatedRules.reduce((max, r) => Math.max(max, parseInt(r.id) || 0), 10000);
          const newId = (maxId + 1).toString();
          updatedRules.unshift({
            id: newId,
            branchId,
            branchName,
            year,
            month,
            status: RuleStatus.DRAFT,
            monthlyQuota,
            updatedAt: new Date().toLocaleString(),
            operator: '当前管理员',
            giftConfigs: [],
            ruleText: '',
            whitelist: []
          });
          created += 1;
        });
        if (created === 0) {
          showToast('没有新规则被导入（可能已存在）', 'error');
          return;
        }
        setRules(updatedRules);
        localStorage.setItem('GIFT_RULES', JSON.stringify(updatedRules));
        showToast(`导入成功：新增 ${created} 条`, 'success');
        setIsImportOpen(false);
      } catch (e) {
        showToast('导入失败：解析错误', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleDownloadTemplate = () => {
    const blob = new Blob([RULE_IMPORT_TEMPLATE], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rule_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Layout>
      {/* Toast Notification */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Page Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">分摊规则管理</h1>
          <p className="text-slate-500 mt-1">管理各分公司的礼品激励与费用分摊规则。</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setIsImportOpen(true)}
            className="flex items-center px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <UploadCloud className="w-4 h-4 mr-2" />
            批量导入
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors shadow-md shadow-primary/20"
          >
            <Plus className="w-4 h-4 mr-2" />
            新建规则
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          
          {/* Attribution Date Filter (Year + Month) */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase">归属月份</label>
            <div className="flex space-x-2">
              {/* Year */}
              <div className="relative">
                <select 
                  className="form-select bg-slate-50 border-slate-200 rounded-md text-sm focus:border-primary focus:ring-primary h-9 pl-3 pr-8 min-w-[90px] appearance-none"
                  value={queryParams.year}
                  onChange={(e) => setQueryParams(prev => ({...prev, year: Number(e.target.value)}))}
                >
                  {[currentYear - 1, currentYear, currentYear + 1].map(y => (
                     <option key={y} value={y}>{y}年</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
              
              {/* Month */}
              <div className="relative">
                <select 
                  className="form-select bg-slate-50 border-slate-200 rounded-md text-sm focus:border-primary focus:ring-primary h-9 pl-3 pr-8 min-w-[90px] appearance-none"
                  value={queryParams.month}
                  onChange={(e) => setQueryParams(prev => ({...prev, month: e.target.value ? Number(e.target.value) : ''}))}
                >
                  <option value="">全年</option>
                  {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                    <option key={m} value={m}>{m}月</option>
                  ))}
                </select>
                {queryParams.month && (
                  <button 
                    onClick={() => clearFilter('month', '')}
                    className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-200"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
            </div>
          </div>

          {/* Branch Filter */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase">分公司</label>
            <div className="relative">
              <select 
                className="form-select bg-slate-50 border-slate-200 rounded-md text-sm focus:border-primary focus:ring-primary h-9 pl-3 pr-8 min-w-[180px] appearance-none"
                value={queryParams.branchId}
                onChange={(e) => setQueryParams(prev => ({...prev, branchId: e.target.value}))}
              >
                <option value="">全部分公司</option>
                {BRANCHES.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              {queryParams.branchId && (
                <button 
                  onClick={() => clearFilter('branchId', '')}
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-200"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
               <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase">状态</label>
            <div className="relative">
              <select 
                className="form-select bg-slate-50 border-slate-200 rounded-md text-sm focus:border-primary focus:ring-primary h-9 pl-3 pr-8 min-w-[140px] appearance-none"
                value={queryParams.status}
                onChange={(e) => setQueryParams(prev => ({...prev, status: e.target.value}))}
              >
                <option value="">全部状态</option>
                {Object.keys(RuleStatus).map(s => (
                  <option key={s} value={s}>{STATUS_CONFIG[s as RuleStatus].label}</option>
                ))}
              </select>
              {queryParams.status && (
                <button 
                  onClick={() => clearFilter('status', '')}
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-200"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
            </div>
          </div>

          {/* Search Filter */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase">搜索</label>
            <div className="relative">
              <input
                type="text"
                placeholder="礼品名称/规则ID"
                className="form-input bg-slate-50 border-slate-200 rounded-md text-sm focus:border-primary focus:ring-primary h-9 pl-3 pr-8 min-w-[160px]"
                value={queryParams.searchText}
                onChange={(e) => setQueryParams(prev => ({...prev, searchText: e.target.value}))}
              />
              {queryParams.searchText && (
                <button 
                  onClick={() => clearFilter('searchText', '')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-200"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 pb-0.5">
            <button 
              onClick={handleSearch}
              className="h-9 px-4 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary-hover transition-colors shadow-sm flex items-center"
            >
              <Search className="w-3.5 h-3.5 mr-1.5" />
              查询
            </button>
            <button 
              onClick={handleReset}
              className="h-9 px-4 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-md hover:bg-slate-50 transition-colors"
            >
              重置
            </button>
          </div>

        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">规则 ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">分公司</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">归属月份</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">礼品名称</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">适用礼品数</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">人均限额</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">状态</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">更新时间</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">操作人</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {filteredRules.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-6 py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center">
                    <Search className="w-10 h-10 text-slate-300 mb-2" />
                    <p>未找到符合条件的规则。</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredRules.map((rule) => {
                const statusMeta = STATUS_CONFIG[rule.status];
                const giftNames = rule.giftConfigs.map(g => g.giftName);
                const giftDisplay = giftNames.length > 0 
                  ? (giftNames.length > 2 ? `${giftNames.slice(0, 2).join(', ')}...` : giftNames.join(', '))
                  : '-';

                return (
                  <tr key={rule.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">#{rule.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{rule.branchName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 font-medium">
                      {rule.year}-{String(rule.month).padStart(2, '0')}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 max-w-[200px] truncate" title={giftNames.join(', ')}>
                      {giftDisplay}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                        {rule.giftConfigs.length} SKU
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{rule.monthlyQuota}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${statusMeta.color}`}>
                        <span className="mr-1">{statusMeta.icon}</span>
                        {statusMeta.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-mono">
                      {rule.updatedAt}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {rule.operator}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button onClick={() => navigate(`/rule/${rule.id}`)} title="查看/编辑" className="text-slate-400 hover:text-primary transition-colors">
                          {rule.status === RuleStatus.DRAFT || rule.status === RuleStatus.PUBLISHED ? (
                            <Edit3 className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                        
                        <button
                          title="复制到目标月"
                          onClick={() => {
                            setCopyTarget({ sourceId: rule.id, year: rule.year, month: rule.month });
                            setIsCopyModalOpen(true);
                          }}
                          className="text-slate-400 hover:text-blue-600 transition-colors"
                        >
                          <Copy className="w-4 h-4" />
                        </button>

                        {rule.status === RuleStatus.DRAFT && (
                           <>
                             <button onClick={() => handlePublishFromList(rule.id)} title="上架" className="text-slate-400 hover:text-green-600 transition-colors">
                                <ArrowUpCircle className="w-4 h-4" />
                             </button>
                             <button onClick={() => handleDelete(rule.id)} title="删除" className="text-slate-400 hover:text-red-600 transition-colors">
                                <Trash2 className="w-4 h-4" />
                             </button>
                           </>
                        )}
                        
                        {rule.status === RuleStatus.PUBLISHED && (
                           <button onClick={() => handleUnpublishFromList(rule.id)} title="下架" className="text-slate-400 hover:text-orange-600 transition-colors">
                              <ArrowDownCircle className="w-4 h-4" />
                           </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4">创建分摊规则</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">分公司</label>
                <select 
                  className="w-full rounded-md border-slate-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  value={newRuleForm.branchId}
                  onChange={e => setNewRuleForm({...newRuleForm, branchId: e.target.value})}
                >
                  <option value="">请选择分公司...</option>
                  {BRANCHES.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">归属年份</label>
                  <select 
                    className="w-full rounded-md border-slate-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    value={newRuleForm.year}
                    onChange={e => setNewRuleForm({...newRuleForm, year: Number(e.target.value)})}
                  >
                    {availableYears.map(y => (
                      <option key={y} value={y}>{y}年</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">归属月份</label>
                  <select 
                    className="w-full rounded-md border-slate-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    value={newRuleForm.month}
                    onChange={e => setNewRuleForm({...newRuleForm, month: Number(e.target.value)})}
                  >
                     {availableMonths.map(m => (
                       <option key={m} value={m}>{m}月</option>
                     ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                取消
              </button>
              <button 
                onClick={handleCreateRule}
                disabled={!newRuleForm.branchId}
                className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
              >
                创建规则
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Copy Modal */}
      {isCopyModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4">复制规则到目标月份</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">归属年份</label>
                <select 
                  className="w-full rounded-md border-slate-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  value={copyTarget.year}
                  onChange={e => setCopyTarget({...copyTarget, year: Number(e.target.value)})}
                >
                  {availableYears.map(y => (
                    <option key={y} value={y}>{y}年</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">归属月份</label>
                <select 
                  className="w-full rounded-md border-slate-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  value={copyTarget.month}
                  onChange={e => setCopyTarget({...copyTarget, month: Number(e.target.value)})}
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                    <option key={m} value={m}>{m}月</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button 
                onClick={() => setIsCopyModalOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                取消
              </button>
              <button 
                onClick={handleCopyRule}
                className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary-hover"
              >
                确认复制
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {isImportOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-slate-900 mb-3">批量导入规则</h3>
            <p className="text-sm text-slate-500 mb-4">支持 CSV 文件，字段：branchId, year, month, monthlyQuota。</p>
            <div className="flex items-center space-x-3 mb-4">
              <button
                onClick={handleDownloadTemplate}
                className="px-3 py-2 text-sm border border-slate-300 rounded-md hover:bg-slate-50"
              >
                下载模板
              </button>
              <label className="px-3 py-2 text-sm bg-slate-900 text-white rounded-md hover:bg-slate-800 cursor-pointer">
                选择文件
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImportRules(file);
                    e.currentTarget.value = '';
                  }}
                />
              </label>
            </div>
            <div className="mt-2 flex justify-end">
              <button
                onClick={() => setIsImportOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};
