"use client";
import React, { useState, useEffect, FC, ReactNode, useMemo, ChangeEvent } from 'react';
import {
  Home, Plus, PieChart as PieChartIcon, User, Lock, Mail, LogOut, Moon, Sun, Info,
  Edit, X, Search, Camera, Wallet, ArrowUp, ArrowDown, DollarSign, Trash2,
  Utensils, Car, Gamepad, Receipt, HeartPulse, MoreHorizontal, HandCoins, Shirt, BrainCircuit,
  Palette, RefreshCcw, Copy, Check
} from 'lucide-react';
import { AnimatePresence, motion, PanInfo } from 'framer-motion';
import { create } from 'zustand';
import { Bar, BarChart, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { format, parseISO, differenceInDays } from 'date-fns';
import { th } from 'date-fns/locale';
import { cva, type VariantProps } from "class-variance-authority";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// --- LIB: UTILS ---
function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

// --- ICON MAP (เก็บสตริงแทน component) ---
type IconKey =
  | 'DollarSign' | 'HandCoins' | 'MoreHorizontal'
  | 'Utensils' | 'Car' | 'Shirt' | 'Gamepad' | 'Receipt' | 'HeartPulse' | 'BrainCircuit';

const ICON_MAP: Record<IconKey, React.ElementType> = {
  DollarSign, HandCoins, MoreHorizontal,
  Utensils, Car, Shirt, Gamepad, Receipt, HeartPulse, BrainCircuit,
};

// --- TYPE DEFINITIONS ---
export interface UserProfile { id: number; name: string; email: string; avatar: string; passwordHash: string; }
export interface Transaction { id: number; type: 'income' | 'expense'; category: string; iconKey: IconKey; name: string; amount: number; date: string; notes?: string; }
type Page = 'dashboard' | 'reports' | 'profile';

// --- CONFIG & INITIAL DATA ---
const INITIAL_CATEGORIES: { income: { name: string; iconKey: IconKey }[]; expense: { name: string; iconKey: IconKey }[] } = {
  income: [
    { name: 'เงินเดือน', iconKey: 'DollarSign' },
    { name: 'รายได้เสริม', iconKey: 'HandCoins' },
    { name: 'อื่นๆ', iconKey: 'MoreHorizontal' },
  ],
  expense: [
    { name: 'อาหาร', iconKey: 'Utensils' },
    { name: 'เดินทาง', iconKey: 'Car' },
    { name: 'ชอปปิง', iconKey: 'Shirt' },
    { name: 'บันเทิง', iconKey: 'Gamepad' },
    { name: 'บิล', iconKey: 'Receipt' },
    { name: 'สุขภาพ', iconKey: 'HeartPulse' },
    { name: 'อื่นๆ', iconKey: 'BrainCircuit' },
  ]
};
const PIE_CHART_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#10b981', '#f59e0b'];

// --- API SIMULATION ---
const api = {
  async getData() {
    await new Promise(res => setTimeout(res, 300));
    const defaultUser: UserProfile = { id: 1, name: 'Somsak', email: 'somsak@demo.com', avatar: '', passwordHash: btoa('1234') };
    // robust parse
    let user: UserProfile | null = null; let txRaw: any[] = [];
    try { const u = localStorage.getItem('user_v5'); user = u ? JSON.parse(u) : null; } catch {}
    try { const t = localStorage.getItem('transactions_v5'); txRaw = t ? JSON.parse(t) : []; } catch {}
    if (!user) user = defaultUser;

    // migrate icon -> iconKey
    const guessIcon = (cat: string): IconKey => {
      switch (cat) {
        case 'เงินเดือน': return 'DollarSign';
        case 'รายได้เสริม': return 'HandCoins';
        case 'อาหาร': return 'Utensils';
        case 'เดินทาง': return 'Car';
        case 'ชอปปิง': return 'Shirt';
        case 'บันเทิง': return 'Gamepad';
        case 'บิล': return 'Receipt';
        case 'สุขภาพ': return 'HeartPulse';
        default: return 'MoreHorizontal';
      }
    };
    const transactions: Transaction[] = (txRaw || []).map((x: any) => ({
      id: x.id,
      type: x.type,
      category: x.category,
      iconKey: x.iconKey ?? guessIcon(x.category),
      name: x.name,
      amount: x.amount,
      date: x.date,
      notes: x.notes,
    }));

    // persist migrated
    try { localStorage.setItem('transactions_v5', JSON.stringify(transactions)); } catch {}
    return { user, transactions };
  },
  async saveData(data: { user: UserProfile | null, transactions: Transaction[] }) {
    await new Promise(res => setTimeout(res, 200));
    localStorage.setItem('user_v5', JSON.stringify(data.user));
    localStorage.setItem('transactions_v5', JSON.stringify(data.transactions));
  }
};

// --- STATE MANAGEMENT (ZUSTAND STORE) ---
interface AppState {
  user: UserProfile | null;
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  fetchData: () => Promise<void>;
  updateProfile: (name: string, avatar: string) => Promise<void>;
  changePassword: (currentPass: string, newPass: string) => Promise<boolean>;
  addTransaction: (t: Omit<Transaction, 'id'>) => Promise<void>;
  updateTransaction: (id: number, t: Omit<Transaction, 'id'>) => Promise<void>;
  deleteTransaction: (id: number) => Promise<void>;
  clearAllData: () => Promise<void>;
}

const useAppStore = create<AppState>((set, get) => ({
  user: null, transactions: [], loading: true, error: null,
  fetchData: async () => {
    set({ loading: true, error: null });
    try {
      const { user, transactions } = await api.getData();
      set({ user, transactions: transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), loading: false });
    } catch (e) { set({ error: 'Failed to fetch data.', loading: false }); }
  },
  login: async (email, pass) => {
    const { user } = await api.getData();
    if (user && user.email === email && atob(user.passwordHash) === pass) { set({ user }); return true; }
    return false;
  },
  logout: () => { set({ user: null }); },
  updateProfile: async (name, avatar) => {
    const state = get(); if (!state.user) return;
    const updatedUser = { ...state.user, name, avatar };
    set({ user: updatedUser });
    await api.saveData({ user: updatedUser, transactions: state.transactions });
  },
  changePassword: async (currentPass, newPass) => {
    const state = get(); if (!state.user || atob(state.user.passwordHash) !== currentPass) return false;
    const updatedUser = { ...state.user, passwordHash: btoa(newPass) };
    set({ user: updatedUser });
    await api.saveData({ user: updatedUser, transactions: state.transactions });
    return true;
  },
  addTransaction: async (t) => {
    const state = get(); if (!state.user) return;
    const newTransaction: Transaction = { ...t, id: Date.now() };
    const updatedTransactions = [newTransaction, ...state.transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    set({ transactions: updatedTransactions });
    await api.saveData({ user: state.user, transactions: updatedTransactions });
  },
  updateTransaction: async (id, t) => {
    const state = get(); if (!state.user) return;
    const updatedTransactions = state.transactions.map(item => item.id === id ? { ...t, id } : item).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    set({ transactions: updatedTransactions });
    await api.saveData({ user: state.user, transactions: updatedTransactions });
  },
  deleteTransaction: async (id) => {
    const state = get(); if (!state.user) return;
    const updatedTransactions = state.transactions.filter(item => item.id !== id);
    set({ transactions: updatedTransactions });
    await api.saveData({ user: state.user, transactions: updatedTransactions });
  },
  clearAllData: async () => {
    const state = get(); if (!state.user) return;
    set({ transactions: [] });
    await api.saveData({ user: state.user, transactions: [] });
  }
}));

// --- REUSABLE UI COMPONENTS ---
const buttonVariants = cva("inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50", { variants: { variant: { default: "bg-indigo-600 text-white hover:bg-indigo-700", destructive: "bg-red-500 text-white hover:bg-red-600", outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground", ghost: "hover:bg-accent hover:text-accent-foreground" }, size: { default: "h-10 px-4 py-2", sm: "h-9 rounded-md px-3", lg: "h-11 rounded-md px-8", icon: "h-10 w-10" } }, defaultVariants: { variant: "default", size: "default" } });
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, ...props }, ref) => <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />);
Button.displayName = "Button";
const Card: FC<{ children: ReactNode; className?: string }> = ({ children, className }) => <div className={cn("bg-white dark:bg-gray-800 rounded-2xl shadow-lg", className)}>{children}</div>;
const Dialog: FC<{ isOpen: boolean; onClose: () => void; children: ReactNode; title: string }> = ({ isOpen, onClose, children, title }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-center p-4 border-b dark:border-gray-700"><h2 className="text-lg font-bold">{title}</h2><Button variant="ghost" size="icon" onClick={onClose}><X size={20}/></Button></div>
          <div className="p-6 max-h-[70vh] overflow-y-auto">{children}</div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);
const Toast: FC<{ message: string; onDone: () => void }> = ({ message, onDone }) => {
  useEffect(() => { const timer = setTimeout(() => onDone(), 2500); return () => clearTimeout(timer); }, [onDone]);
  return <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }} className="fixed top-5 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-6 py-3 rounded-full shadow-lg z-[100]">{message}</motion.div>;
};
const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => <input className={cn("h-10 w-full rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-sm ring-offset-background placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2", className)} ref={ref} {...props} />);
Input.displayName = "Input";

// --- THEME BACKGROUND PRESETS ---
const GRADIENT_PRESETS: { name: string; value: string }[] = [
  { name: 'Indigo Sky', value: 'linear-gradient(135deg, #c7d2fe 0%, #eef2ff 50%, #dbeafe 100%)' },
  { name: 'Sunset', value: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' },
  { name: 'Aurora', value: 'linear-gradient(135deg, #a1ffce 0%, #faffd1 100%)' },
  { name: 'Ocean', value: 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)' },
  { name: 'Candy', value: 'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)' },
  { name: 'Graphite', value: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)' },
];

// --- PAGE COMPONENTS ---
const LoginPage: FC<{ showToast: (msg: string) => void }> = ({ showToast }) => {
  const [email, setEmail] = useState('somsak@demo.com');
  const [password, setPassword] = useState('1234');
  const [error, setError] = useState('');
  const login = useAppStore(state => state.login);
  const [loading, setLoading] = useState(false);
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('');
    const success = await login(email, password);
    if (success) { showToast("เข้าสู่ระบบสำเร็จ!"); } else { setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง'); setLoading(false); }
  };
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-100 to-white dark:from-gray-900 dark:to-indigo-900 text-gray-800 dark:text-gray-200 p-4">
      <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, type: 'spring' }} className="text-center mb-12">
        <div className="w-24 h-24 bg-indigo-500 text-white rounded-full flex items-center justify-center mx-auto shadow-2xl mb-4"><Wallet size={40} /></div>
        <h1 className="text-3xl sm:text-4xl font-bold text-indigo-800 dark:text-white">Expense Tracker Pro</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">บันทึกรายจ่ายในสไตล์ของคุณ</p>
      </motion.div>
      <motion.form initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} onSubmit={handleLogin} className="w-full max-w-sm space-y-4">
        <div className="relative"><Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} /><Input type="email" placeholder="อีเมล (somsak@demo.com)" value={email} onChange={e => setEmail(e.target.value)} className="pl-12" required/></div>
        <div className="relative"><Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} /><Input type="password" placeholder="รหัสผ่าน (1234)" value={password} onChange={e => setPassword(e.target.value)} className="pl-12" required/></div>
        {error && <p className="text-red-500 text-sm text-center pt-2">{error}</p>}
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} type="submit" disabled={loading} className={cn(buttonVariants({ size: 'lg' }), "w-full")}>{loading ? 'กำลังโหลด...' : 'เข้าสู่ระบบ'}</motion.button>
      </motion.form>
    </div>
  );
};

const TransactionForm: FC<{ isOpen: boolean; onClose: () => void; transactionToEdit: Transaction | null; showToast: (msg: string) => void; }> = ({ isOpen, onClose, transactionToEdit, showToast }) => {
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<{name: string, iconKey: IconKey} | null>(null);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const { addTransaction, updateTransaction } = useAppStore();
  useEffect(() => {
    if (transactionToEdit) {
      setType(transactionToEdit.type); setName(transactionToEdit.name); setAmount(String(transactionToEdit.amount));
      const cats = INITIAL_CATEGORIES[transactionToEdit.type];
      setCategory(cats.find(c => c.name === transactionToEdit.category) || null);
      setDate(format(parseISO(transactionToEdit.date), 'yyyy-MM-dd')); setNotes(transactionToEdit.notes || '');
    } else { setType('expense'); setName(''); setAmount(''); setCategory(null); setDate(format(new Date(), 'yyyy-MM-dd')); setNotes(''); }
  }, [transactionToEdit, isOpen]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount || !category || parseFloat(amount) <= 0) { setError('กรุณากรอกข้อมูลให้ครบถ้วน'); return; }
    const transactionData: Omit<Transaction,'id'> = { type, name, amount: parseFloat(amount), category: category.name, iconKey: category.iconKey, date, notes };
    if (transactionToEdit) { await updateTransaction(transactionToEdit.id, transactionData); showToast("แก้ไขรายการเรียบร้อยแล้ว"); } else { await addTransaction(transactionData); showToast("เพิ่มรายการเรียบร้อยแล้ว"); }
    onClose();
  };
  const currentCategories = INITIAL_CATEGORIES[type];
  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={transactionToEdit ? "แก้ไขรายการ" : "เพิ่มรายการใหม่"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-2 p-1 bg-gray-200 dark:bg-gray-700 rounded-lg">
          <button type="button" onClick={() => { setType('expense'); setCategory(null); }} className={`py-2 rounded-md font-semibold transition ${type === 'expense' ? 'bg-red-500 text-white shadow' : ''}`}>รายจ่าย</button>
          <button type="button" onClick={() => { setType('income'); setCategory(null); }} className={`py-2 rounded-md font-semibold transition ${type === 'income' ? 'bg-green-500 text-white shadow' : ''}`}>รายรับ</button>
        </div>
        <div><label className="text-sm font-medium">ชื่อรายการ</label><Input type="text" value={name} onChange={e => setName(e.target.value)} /></div>
        <div><label className="text-sm font-medium">จำนวนเงิน</label><Input type="number" value={amount} onChange={e => setAmount(e.target.value)} /></div>
        <div>
          <label className="text-sm font-medium">หมวดหมู่</label>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-2">
            {currentCategories.map(cat => { const Icon = ICON_MAP[cat.iconKey]; return (
              <button key={cat.name} type="button" onClick={() => setCategory(cat)} className={`flex flex-col items-center p-2 rounded-lg transition border-2 ${category?.name === cat.name ? 'border-indigo-500 bg-indigo-100 dark:bg-indigo-900' : 'border-transparent bg-gray-100 dark:bg-gray-700'}`}>
                <Icon className="w-5 h-5 mb-1" /><span className="text-xs">{cat.name}</span>
              </button>
            ); })}
          </div>
        </div>
        <div><label className="text-sm font-medium">วันที่</label><Input type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
        <div><label className="text-sm font-medium">หมายเหตุ (ถ้ามี)</label><textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full mt-1 p-2 bg-gray-100 dark:bg-gray-700 rounded-md" rows={2}></textarea></div>
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        <div className="flex justify-end gap-2 pt-4"><Button type="button" variant="ghost" onClick={onClose}>ยกเลิก</Button><Button type="submit">{transactionToEdit ? 'บันทึกการแก้ไข' : 'เพิ่มรายการ'}</Button></div>
      </form>
    </Dialog>
  );
};

const TransactionItem: FC<{ transaction: Transaction; onDelete: (id: number) => void; onEdit: (t: Transaction) => void; }> = ({ transaction: t, onDelete, onEdit }) => {
  const handleDragEnd = (_: any, info: PanInfo) => { if (info.offset.x < -80) onDelete(t.id); if (info.offset.x > 80) onEdit(t); };
  const Icon = ICON_MAP[t.iconKey] || MoreHorizontal;
  return (
    <div className="relative group">
      <div className="absolute inset-y-0 left-0 flex items-center pl-6 bg-blue-500 rounded-l-lg text-white opacity-0 group-hover:opacity-100 transition-opacity"><Edit size={20}/></div>
      <div className="absolute inset-y-0 right-0 flex items-center pr-6 bg-red-500 rounded-r-lg text-white opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={20}/></div>
      <motion.div layout drag="x" style={{ touchAction: 'pan-y' }} dragConstraints={{ left: 0, right: 0 }} dragElastic={0.2} onDragEnd={handleDragEnd} className="relative bg-white dark:bg-gray-800 flex items-center justify-between p-4 rounded-lg z-10 shadow-sm cursor-grab active:cursor-grabbing">
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${t.type === 'income' ? 'bg-green-100 dark:bg-green-900 text-green-500' : 'bg-red-100 dark:bg-red-900 text-red-500'}`}><Icon size={20} /></div>
          <div><p className="font-semibold">{t.name}</p><p className="text-sm text-gray-500 dark:text-gray-400">{t.category}</p></div>
        </div>
        <p className={`font-bold ${t.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>{t.type === 'income' ? '+' : '-'}฿{t.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
      </motion.div>
    </div>
  );
};

const DashboardPage: FC<{ onEdit: (t: Transaction) => void; onAdd: () => void; showToast: (msg: string) => void; }> = ({ onEdit, onAdd, showToast }) => {
  const { transactions, loading, deleteTransaction } = useAppStore();
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const filteredTransactions = useMemo(() => transactions.filter(t => filter === 'all' || t.type === filter).filter(t => searchTerm === '' || t.name.toLowerCase().includes(searchTerm.toLowerCase()) || t.category.toLowerCase().includes(searchTerm.toLowerCase())), [transactions, filter, searchTerm]);
  const groupedTransactions = useMemo(() => filteredTransactions.reduce((acc, t) => { const date = format(parseISO(t.date), 'd MMMM yyyy', { locale: th }); if (!acc[date]) acc[date] = []; acc[date].push(t); return acc; }, {} as Record<string, Transaction[]>), [filteredTransactions]);
  const { totalIncome, totalExpense, balance, avgDailySpend } = useMemo(() => {
    const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const firstDay = transactions.length > 0 ? parseISO(transactions[transactions.length - 1].date) : new Date();
    const days = differenceInDays(new Date(), firstDay) + 1;
    const avgSpend = days > 0 ? expense / days : 0;
    return { totalIncome: income, totalExpense: expense, balance: income - expense, avgDailySpend: avgSpend };
  }, [transactions]);
  
  const handleDelete = async (id: number) => { await deleteTransaction(id); showToast("ลบรายการแล้ว"); };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-indigo-600 to-indigo-800 text-white p-6">
        <div className="flex justify-between items-start">
          <div><p className="opacity-80">ยอดคงเหลือ</p><p className="text-4xl font-bold tracking-tighter">฿{balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p><p className="opacity-80 text-sm mt-2">ค่าใช้จ่ายเฉลี่ย: ฿{avgDailySpend.toLocaleString('en-US', { minimumFractionDigits: 2 })}/วัน</p></div>
          <div className="text-right text-sm"><div className="flex items-center gap-2"><ArrowUp className="w-4 h-4 text-green-300" /> <span>รายรับ</span> <span className="font-semibold">฿{totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></div><div className="flex items-center gap-2"><ArrowDown className="w-4 h-4 text-red-300" /> <span>รายจ่าย</span> <span className="font-semibold">฿{totalExpense.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></div></div>
        </div>
      </Card>
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
          <h2 className="text-xl font-bold">รายการล่าสุด</h2>
          <div className="relative w-full sm:w-auto"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20}/><Input placeholder="ค้นหา..." className="pl-10 w-full sm:w-64" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
          <div className="flex items-center gap-2 shrink-0"><Button variant={filter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('all')}>ทั้งหมด</Button><Button variant={filter === 'expense' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('expense')}>รายจ่าย</Button><Button variant={filter === 'income' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('income')}>รายรับ</Button></div>
        </div>
        {loading ? <p className="text-center py-10">กำลังโหลดข้อมูล...</p> : filteredTransactions.length === 0 ? (
          <div className="text-center text-gray-500 py-10">
            <Info className="mx-auto mb-2" /><p>ไม่มีรายการที่ตรงกับผลการค้นหา</p>
            {searchTerm === '' && <Button size="sm" className="mt-4" onClick={onAdd}>เริ่มบันทึกรายการแรก</Button>}
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedTransactions).map(([date, dateTransactions]) => (
              <div key={date}>
                <p className="text-gray-500 dark:text-gray-400 font-semibold my-3 text-sm">{date}</p>
                <div className="space-y-2">{dateTransactions.map(t => <TransactionItem key={t.id} transaction={t} onDelete={handleDelete} onEdit={onEdit} />)}</div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

const ReportsPage: FC = () => {
  const { transactions } = useAppStore();
  const expenseByCategory = useMemo(() => Object.entries(transactions.filter(t => t.type === 'expense').reduce((acc, t) => { if (!acc[t.category]) acc[t.category] = 0; acc[t.category] += t.amount; return acc; }, {} as Record<string, number>)).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value), [transactions]);
  const monthlyData = useMemo(() => Object.values(transactions.reduce((acc, t) => { const month = format(parseISO(t.date), 'yyyy-MM'); if (!acc[month]) acc[month] = { month, income: 0, expense: 0 }; acc[month][t.type] += t.amount; return acc; }, {} as Record<string, { month: string, income: number, expense: number }>)).sort((a,b) => a.month.localeCompare(b.month)), [transactions]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">รายงานสรุป</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">สัดส่วนรายจ่าย</h2>
          {expenseByCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={expenseByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} labelLine={false} label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}>
                  {expenseByCategory.map((_, index) => <Cell key={`cell-${index}`} fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(value: number) => `฿${value.toLocaleString()}`}/>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="text-center text-gray-500 py-10"><Info className="mx-auto mb-2" /><p>ไม่มีข้อมูลรายจ่าย</p></div>}
        </Card>
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">ภาพรวมรายเดือน</h2>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <XAxis dataKey="month" tickFormatter={(tick: string) => format(new Date(`${tick}-01`), 'MMM yy', { locale: th })} />
                <YAxis tickFormatter={(tick) => `฿${(tick/1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: number) => `฿${value.toLocaleString()}`} />
                <Legend />
                <Bar dataKey="income" fill="#10b981" name="รายรับ" stackId="a" />
                <Bar dataKey="expense" fill="#ef4444" name="รายจ่าย" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="text-center text-gray-500 py-10"><Info className="mx-auto mb-2" /><p>ไม่มีข้อมูล</p></div>}
        </Card>
      </div>
    </div>
  );
}

// --- PROFILE PAGE WITH THEME CONTROLS ---
const ProfilePage: FC<{ showToast: (msg: string) => void; currentBg: string; onChangeBg: (v: string) => void; }> = ({ showToast, currentBg, onChangeBg }) => {
  const { user, updateProfile, changePassword, clearAllData } = useAppStore();
  const [name, setName] = useState(user?.name || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [solidColor, setSolidColor] = useState('#0ea5e9');
  const [customCSS, setCustomCSS] = useState(currentBg || '');
  const [copied, setCopied] = useState(false);

  useEffect(() => setCustomCSS(currentBg || ''), [currentBg]);

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => { if (e.target.files?.[0]) { const reader = new FileReader(); reader.onload = (event) => setAvatar(event.target?.result as string); reader.readAsDataURL(e.target.files[0]); } };
  const handleProfileUpdate = async (e: React.FormEvent) => { e.preventDefault(); await updateProfile(name, avatar); showToast("อัปเดตโปรไฟล์สำเร็จ!"); };
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { showToast("รหัสผ่านใหม่ไม่ตรงกัน"); return; }
    if (newPassword.length < 4) { showToast("รหัสผ่านใหม่ต้องมี 4 ตัวอักษรขึ้นไป"); return; }
    const success = await changePassword(currentPassword, newPassword);
    if (success) { showToast("เปลี่ยนรหัสผ่านสำเร็จ!"); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); } else { showToast("รหัสผ่านปัจจุบันไม่ถูกต้อง"); }
  };
  const handleReset = async () => { if(window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลธุรกรรมทั้งหมด? การกระทำนี้ไม่สามารถย้อนกลับได้")) { await clearAllData(); showToast("ข้อมูลทั้งหมดถูกลบแล้ว"); }};

  if (!user) return null;
  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold">โปรไฟล์และการตั้งค่า</h1>

      {/* PERSONAL INFO */}
      <Card>
        <form onSubmit={handleProfileUpdate} className="p-6 space-y-4">
          <h2 className="text-xl font-bold">ข้อมูลส่วนตัว</h2>
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="relative">
              <img src={avatar || `https://ui-avatars.com/api/?name=${name}&background=random`} alt="Avatar" className="w-24 h-24 rounded-full object-cover ring-4 ring-indigo-200 dark:ring-indigo-800"/>
              <label htmlFor="avatar-upload" className="absolute -bottom-2 -right-2 bg-indigo-600 text-white p-2 rounded-full cursor-pointer hover:bg-indigo-700 transition-transform hover:scale-110"><Camera size={16}/><input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} /></label>
            </div>
          </div>
          <div><label className="text-sm font-medium">ชื่อ</label><Input value={name} onChange={e => setName(e.target.value)} /></div>
          <div><label className="text-sm font-medium">อีเมล</label><Input value={user.email} disabled /></div>
          <div className="text-right pt-2"><Button type="submit">บันทึกข้อมูล</Button></div>
        </form>
      </Card>

      {/* THEME & BACKGROUND */}
      <Card>
        <div className="p-6 space-y-5">
          <h2 className="text-xl font-bold flex items-center gap-2"><Palette className="w-5 h-5"/> ธีม & พื้นหลัง</h2>

          {/* Solid color picker */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-semibold">เลือกสีพื้นหลัง (Solid)</p>
              <div className="flex items-center gap-3">
                <input aria-label="solid-color" type="color" value={solidColor} onChange={e => setSolidColor(e.target.value)} className="h-10 w-16 rounded cursor-pointer border" />
                <Button onClick={() => { onChangeBg(solidColor); setCustomCSS(solidColor); }}>ใช้สีนี้</Button>
              </div>
              <p className="text-xs text-gray-500">Tip: ใส่ค่าสี Hex/rgba ในช่องด้านขวาก็ได้</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold">CSS พื้นหลังแบบกำหนดเอง</p>
              <input value={customCSS} onChange={e => setCustomCSS(e.target.value)} placeholder="ตัวอย่าง: linear-gradient(135deg, #ffecd2, #fcb69f)" className="w-full h-10 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 px-3 text-sm" />
              <div className="flex gap-2">
                <Button onClick={() => onChangeBg(customCSS)}>ใช้ค่านี้</Button>
                <Button variant="outline" onClick={() => { navigator.clipboard.writeText(customCSS); setCopied(true); setTimeout(()=>setCopied(false), 1200); }}>
                  {copied ? <><Check className="w-4 h-4 mr-2"/>คัดลอกแล้ว</> : <><Copy className="w-4 h-4 mr-2"/>คัดลอก</>}
                </Button>
                <Button variant="ghost" onClick={() => { onChangeBg(''); setCustomCSS(''); }}><RefreshCcw className="w-4 h-4 mr-2"/>รีเซ็ตค่าเริ่มต้น</Button>
              </div>
            </div>
          </div>

          {/* Presets */}
          <div className="space-y-2">
            <p className="text-sm font-semibold">พรีเซ็ตกราเดียนต์</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {GRADIENT_PRESETS.map(p => (
                <button key={p.name} title={p.name} onClick={() => { onChangeBg(p.value); setCustomCSS(p.value); }} className="relative rounded-xl h-20 border overflow-hidden group">
                  <div className="absolute inset-0" style={{ background: p.value }} />
                  <span className="absolute bottom-1 left-1 text-[11px] bg-black/50 text-white px-2 py-0.5 rounded">{p.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Live preview box */}
          <div className="space-y-2">
            <p className="text-sm font-semibold">พรีวิว</p>
            <div className="rounded-2xl border h-28 shadow-inner" style={{ background: currentBg || undefined }} />
            <p className="text-xs text-gray-500">บันทึกอัตโนมัติในเครื่อง (localStorage) และจะจำค่าพื้นหลังให้คุณ</p>
          </div>
        </div>
      </Card>

      {/* PASSWORD */}
      <Card>
        <form onSubmit={handlePasswordChange} className="p-6 space-y-4">
          <h2 className="text-xl font-bold">เปลี่ยนรหัสผ่าน</h2>
          <p className="text-sm text-gray-500"><b>หมายเหตุ:</b> ระบบนี้เป็นเพียงการจำลอง ไม่มีความปลอดภัยสำหรับการใช้งานจริง</p>
          <div><label className="text-sm font-medium">รหัสผ่านปัจจุบัน</label><Input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} /></div>
          <div><label className="text-sm font-medium">รหัสผ่านใหม่</label><Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} /></div>
          <div><label className="text-sm font-medium">ยืนยันรหัสผ่านใหม่</label><Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} /></div>
          <div className="text-right pt-2"><Button type="submit">เปลี่ยนรหัสผ่าน</Button></div>
        </form>
      </Card>

      {/* DANGER ZONE */}
      <Card className="p-6 border-2 border-red-500/50">
        <h2 className="text-xl font-bold text-red-500">โซนอันตราย</h2>
        <p className="text-gray-500 mb-4 mt-2">ลบข้อมูลธุรกรรมทั้งหมดของคุณอย่างถาวร การกระทำนี้ไม่สามารถย้อนกลับได้</p>
        <Button variant="destructive" onClick={handleReset}>ล้างข้อมูลธุรกรรมทั้งหมด</Button>
      </Card>
    </div>
  );
}

// --- MAIN APP COMPONENT ---
export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const { user, loading, fetchData, logout } = useAppStore();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);

  // background string (solid color or CSS gradient)
  const [backgroundCSS, setBackgroundCSS] = useState<string>('');

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { const savedDark = localStorage.getItem('darkMode') === 'true'; setIsDarkMode(savedDark); if(savedDark) document.documentElement.classList.add('dark');
                    const savedBg = localStorage.getItem('app_bg_v1') || ''; setBackgroundCSS(savedBg); }, []);
  useEffect(() => { localStorage.setItem('darkMode', String(isDarkMode)); document.documentElement.classList.toggle('dark', isDarkMode); }, [isDarkMode]);
  useEffect(() => { localStorage.setItem('app_bg_v1', backgroundCSS || ''); }, [backgroundCSS]);
  
  const showToast = (msg: string) => setToastMessage(msg);
  const handleOpenFormToAdd = () => { setTransactionToEdit(null); setIsFormOpen(true); };
  const handleOpenFormToEdit = (t: Transaction) => { setTransactionToEdit(t); setIsFormOpen(true); };

  if (loading && !user) return <div className="h-screen w-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div><p className="mt-4">กำลังโหลด...</p></div>;
  if (!user) return <div className={cn({ 'dark': isDarkMode })}><LoginPage showToast={showToast} /></div>;

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <DashboardPage onEdit={handleOpenFormToEdit} onAdd={handleOpenFormToAdd} showToast={showToast} />;
      case 'reports': return <ReportsPage />;
      case 'profile': return <ProfilePage showToast={showToast} currentBg={backgroundCSS} onChangeBg={setBackgroundCSS} />;
      default: return <DashboardPage onEdit={handleOpenFormToEdit} onAdd={handleOpenFormToAdd} showToast={showToast}/>;
    }
  };

  return (
    <div className="text-gray-800 dark:text-gray-200 font-sans min-h-screen" style={{ background: backgroundCSS || undefined }}>
      <AnimatePresence>{toastMessage && <Toast message={toastMessage} onDone={() => setToastMessage(null)} />}</AnimatePresence>
      <div className="flex">
        <nav className="w-20 lg:w-64 bg-white dark:bg-gray-800 p-4 h-screen shadow-lg flex flex-col shrink-0">
          <div className="text-indigo-600 font-bold text-2xl mb-10 hidden lg:flex items-center gap-2"><Wallet size={28}/><span>Expense Pro</span></div>
          <div className="text-indigo-600 font-bold text-2xl mb-10 lg:hidden text-center"><Wallet size={32}/></div>
          <ul className="space-y-2">
            {[{ name: 'dashboard', icon: Home, label: 'แดชบอร์ด' }, { name: 'reports', icon: PieChartIcon, label: 'รายงาน' }, { name: 'profile', icon: User, label: 'โปรไฟล์' }].map(item => (
              <li key={item.name} onClick={() => setCurrentPage(item.name as Page)} className={cn("flex items-center p-3 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer", { "bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-white font-semibold": currentPage === item.name })}>
                <item.icon size={20} className="mr-0 lg:mr-4 shrink-0"/><span className="hidden lg:inline">{item.label}</span>
              </li>
            ))}
          </ul>
          <div className="mt-auto">
            <Button variant="ghost" className="w-full justify-start" onClick={() => { showToast("ออกจากระบบสำเร็จ"); logout(); }}>
              <LogOut size={20} className="mr-0 lg:mr-2 shrink-0"/><span className="hidden lg:inline">ออกจากระบบ</span>
            </Button>
          </div>
        </nav>
        <main className="flex-1 p-6 overflow-y-auto h-screen">
          <header className="flex flex-wrap justify-between items-center gap-4 mb-6">
            <div className="flex items-center gap-4">
              <img src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=random`} alt="Avatar" className="w-10 h-10 rounded-full"/>
              <div>
                <h1 className="text-2xl font-bold">สวัสดี, {user.name}</h1>
                <p className="text-sm text-gray-500">วันที่ {format(new Date(), 'd MMMM yyyy', { locale: th })}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleOpenFormToAdd}><Plus className="mr-2 h-4 w-4"/>เพิ่มรายการ</Button>
              <Button variant="ghost" size="icon" onClick={() => setIsDarkMode(!isDarkMode)}>{isDarkMode ? <Sun/> : <Moon/>}</Button>
            </div>
          </header>
          <AnimatePresence mode="wait">
            <motion.div key={currentPage} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.2 }}>
              {renderPage()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <TransactionForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} transactionToEdit={transactionToEdit} showToast={showToast} />
    </div>
  );
}
