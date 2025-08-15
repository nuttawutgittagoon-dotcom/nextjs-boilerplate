"use client";
import React, { useState, useEffect, FC, ReactNode } from 'react';
import { Home, Plus, PieChart, User, Eye, Lock, Mail, ChevronLeft, LogOut, Moon, Sun, ShoppingCart, Utensils, Bus, Film, MoreHorizontal, ArrowUp, ArrowDown, CreditCard, DollarSign } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

// --- MOCK DATA (ข้อมูลจำลองที่ละเอียดขึ้น) ---
const mockUser = {
  name: 'Somsak',
  avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704d', // Placeholder image
};

const mockTransactions = [
  { id: 1, type: 'expense', category: 'อาหาร', icon: Utensils, name: 'มื้อกลางวัน', amount: 120.00, date: '2025-08-15' },
  { id: 2, type: 'expense', category: 'เดินทาง', icon: Bus, name: 'ค่ารถไฟฟ้า', amount: 59.00, date: '2025-08-15' },
  { id: 3, type: 'income', category: 'เงินเดือน', icon: DollarSign, name: 'เงินเดือนเข้า', amount: 25000.00, date: '2025-08-15' },
  { id: 4, type: 'expense', category: 'ชอปปิง', icon: ShoppingCart, name: 'ซื้อเสื้อ', amount: 890.00, date: '2025-08-14' },
  { id: 5, type: 'expense', category: 'บันเทิง', icon: Film, name: 'ดูหนัง', amount: 250.00, date: '2025-08-14' },
  { id: 6, type: 'expense', category: 'อาหาร', icon: Utensils, name: 'กาแฟ', amount: 75.00, date: '2025-08-13' },
  { id: 7, type: 'expense', category: 'อื่นๆ', icon: MoreHorizontal, name: 'ค่าบริการ', amount: 300.00, date: '2025-08-12' },
];

// --- TYPE DEFINITIONS (กำหนดประเภทข้อมูล) ---
type Page = 'login' | 'home' | 'add_transaction' | 'reports' | 'profile';
interface NavigationProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}
interface PageProps {
  onNavigate: (page: Page) => void;
}

// --- REUSABLE COMPONENTS (ส่วนประกอบที่ใช้ซ้ำ) ---

const Card: FC<{ children: ReactNode; className?: string }> = ({ children, className }) => (
  <div className={`bg-white dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 ${className}`}>
    {children}
  </div>
);

const PageContainer: FC<{ children: ReactNode }> = ({ children }) => (
  <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 p-4 sm:p-6 pb-28 font-sans">
    {children}
  </div>
);

// --- LOGIN PAGE ---
const LoginPage: FC<{ onLoginSuccess: () => void }> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if ((username === 'user' && password === '1234') || (username === 'somsak' && password === '1234')) {
      onLoginSuccess();
    } else {
      setError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-100 to-white dark:from-gray-900 dark:to-indigo-900 text-gray-800 dark:text-gray-200 p-4">
      <motion.div 
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, type: 'spring' }}
        className="text-center mb-12"
      >
        <div className="w-24 h-24 bg-indigo-500 text-white rounded-full flex items-center justify-center mx-auto shadow-2xl mb-4">
          <CreditCard size={40} />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-indigo-800 dark:text-white">Expense Tracker</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">บันทึกรายจ่ายในสไตล์ของคุณ</p>
      </motion.div>

      <motion.form
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        onSubmit={handleLogin}
        className="w-full max-w-sm space-y-4"
      >
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="ชื่อผู้ใช้ (user หรือ somsak)"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm py-4 pl-12 pr-4 rounded-xl shadow-md outline-none focus:ring-2 focus:ring-indigo-500 transition"
          />
        </div>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="password"
            placeholder="รหัสผ่าน (1234)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm py-4 pl-12 pr-4 rounded-xl shadow-md outline-none focus:ring-2 focus:ring-indigo-500 transition"
          />
        </div>
        
        {error && <p className="text-red-500 text-sm text-center pt-2">{error}</p>}

        <div className="flex justify-between items-center text-sm pt-2">
          <a href="#" className="text-indigo-600 dark:text-indigo-400 hover:underline">ลงทะเบียน</a>
          <a href="#" className="text-gray-600 dark:text-gray-400 hover:underline">ลืมรหัสผ่าน?</a>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="submit"
          className="w-full bg-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-indigo-600 transition-colors"
        >
          เข้าสู่ระบบ
        </motion.button>
      </motion.form>
    </div>
  );
};

// --- HOME PAGE / DASHBOARD ---
const HomePage: FC<PageProps> = ({ onNavigate }) => {
  const totalIncome = mockTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = mockTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpense;

  const groupedTransactions = mockTransactions.reduce((acc, t) => {
    const date = new Date(t.date).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(t);
    return acc;
  }, {} as Record<string, typeof mockTransactions>);

  return (
    <PageContainer>
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center mb-8"
      >
        <div>
          <p className="text-gray-500 dark:text-gray-400">สวัสดีตอนบ่าย</p>
          <h1 className="text-2xl font-bold">{mockUser.name}!</h1>
        </div>
        <img src={mockUser.avatarUrl} alt="User Avatar" className="w-12 h-12 rounded-full" />
      </motion.header>

      {/* Summary Card */}
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
        <Card className="bg-gradient-to-br from-indigo-500 to-indigo-700 text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="opacity-80">ยอดคงเหลือ</p>
              <p className="text-4xl font-bold tracking-tighter">฿{balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2">
                <ArrowUp className="w-4 h-4 text-green-300" />
                <span className="opacity-80">รายรับ</span>
                <span className="font-semibold">฿{totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex items-center gap-2">
                <ArrowDown className="w-4 h-4 text-red-300" />
                <span className="opacity-80">รายจ่าย</span>
                <span className="font-semibold">฿{totalExpense.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
          <div className="w-full bg-black/20 rounded-full h-2.5 mt-4">
            <div className="bg-green-400 h-2.5 rounded-full" style={{ width: `${(totalIncome / (totalIncome + totalExpense)) * 100}%` }}></div>
          </div>
        </Card>
      </motion.div>

      {/* Recent Transactions */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-8"
      >
        <h2 className="text-xl font-bold mb-4">รายการล่าสุด</h2>
        <div className="space-y-4">
          <AnimatePresence>
            {Object.entries(groupedTransactions).map(([date, transactions]) => (
              <motion.div key={date} layout>
                <p className="text-gray-500 dark:text-gray-400 font-semibold my-3">{date}</p>
                <Card className="p-0">
                  <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                    {transactions.map((t, index) => (
                      <motion.li
                        key={t.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + index * 0.05 }}
                        className="flex items-center justify-between p-4"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${t.type === 'income' ? 'bg-green-100 dark:bg-green-900 text-green-500' : 'bg-red-100 dark:bg-red-900 text-red-500'}`}>
                            <t.icon size={20} />
                          </div>
                          <div>
                            <p className="font-semibold">{t.name}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{t.category}</p>
                          </div>
                        </div>
                        <p className={`font-bold ${t.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                          {t.type === 'income' ? '+' : '-'}฿{t.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                      </motion.li>
                    ))}
                  </ul>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.section>
    </PageContainer>
  );
};

// --- ADD TRANSACTION PAGE ---
const AddTransactionPage: FC<PageProps> = ({ onNavigate }) => {
  return (
    <PageContainer>
      <header className="flex items-center mb-8">
        <button onClick={() => onNavigate('home')} className="p-2 -ml-2">
          <ChevronLeft />
        </button>
        <h1 className="text-2xl font-bold mx-auto">เพิ่มรายการใหม่</h1>
      </header>

      <Card>
        <form className="space-y-6">
          <div>
            <label className="text-sm font-medium text-gray-500">ชื่อรายการ</label>
            <input type="text" placeholder="เช่น ค่ากาแฟ" className="w-full mt-2 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">จำนวนเงิน</label>
            <div className="relative mt-2">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">฿</span>
              <input type="number" placeholder="0.00" className="w-full p-3 pl-8 bg-gray-100 dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">หมวดหมู่</label>
            <div className="grid grid-cols-4 gap-4 mt-2">
              {[{name: 'อาหาร', icon: Utensils}, {name: 'เดินทาง', icon: Bus}, {name: 'ชอปปิง', icon: ShoppingCart}, {name: 'บันเทิง', icon: Film}].map(cat => (
                <button key={cat.name} type="button" className="flex flex-col items-center p-3 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-800 transition">
                  <cat.icon className="w-6 h-6 mb-1 text-gray-600 dark:text-gray-300" />
                  <span className="text-xs">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">วันที่</label>
            <input type="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full mt-2 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
           <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            onClick={() => onNavigate('home')}
            className="w-full bg-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-indigo-600 transition-colors"
          >
            บันทึกรายการ
          </motion.button>
        </form>
      </Card>
    </PageContainer>
  );
};


// --- REPORTS PAGE ---
const ReportsPage: FC<PageProps> = ({ onNavigate }) => {
    const expenseByCategory = mockTransactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => {
            if (!acc[t.category]) {
                acc[t.category] = 0;
            }
            acc[t.category] += t.amount;
            return acc;
        }, {} as Record<string, number>);

    const maxExpense = Math.max(...Object.values(expenseByCategory));

    return (
        <PageContainer>
            <header className="text-center mb-8">
                <h1 className="text-2xl font-bold">รายงานสรุป</h1>
                <p className="text-gray-500">สรุปค่าใช้จ่ายตามหมวดหมู่</p>
            </header>
            <Card>
                <div className="space-y-4">
                    {Object.entries(expenseByCategory).map(([category, amount]) => (
                        <div key={category}>
                            <div className="flex justify-between mb-1">
                                <span className="font-semibold">{category}</span>
                                <span className="text-gray-500">฿{amount.toLocaleString()}</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                                <div 
                                    className="bg-gradient-to-r from-orange-400 to-red-500 h-2.5 rounded-full"
                                    style={{ width: `${(amount / maxExpense) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        </PageContainer>
    );
};

// --- PROFILE PAGE ---
const ProfilePage: FC<PageProps & { isDarkMode: boolean; toggleDarkMode: () => void }> = ({ onNavigate, isDarkMode, toggleDarkMode }) => {
    return (
        <PageContainer>
            <header className="text-center mb-8">
                <img src={mockUser.avatarUrl} alt="User Avatar" className="w-24 h-24 rounded-full mx-auto mb-4 ring-4 ring-indigo-300 dark:ring-indigo-700" />
                <h1 className="text-2xl font-bold">{mockUser.name}</h1>
                <p className="text-gray-500">user@example.com</p>
            </header>
            
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-500 px-2">ตั้งค่าทั่วไป</h2>
              <Card className="p-0">
                  <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                      <li className="flex justify-between items-center p-4">
                          <span className="font-semibold">โหมดกลางคืน</span>
                          <button onClick={toggleDarkMode} className={`w-14 h-8 rounded-full p-1 flex items-center transition-colors ${isDarkMode ? 'bg-indigo-500 justify-end' : 'bg-gray-300 justify-start'}`}>
                              <motion.div layout className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
                                  {isDarkMode ? <Moon size={16} className="text-indigo-500" /> : <Sun size={16} className="text-gray-500" />}
                              </motion.div>
                          </button>
                      </li>
                      <li className="flex justify-between items-center p-4">
                          <span className="font-semibold">แก้ไขโปรไฟล์</span>
                      </li>
                  </ul>
              </Card>

              <h2 className="text-lg font-bold text-gray-500 px-2 mt-6">อื่นๆ</h2>
              <Card className="p-0">
                <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                    <li className="p-4">
                        <button onClick={() => onNavigate('login')} className="w-full text-left font-semibold text-red-500 flex items-center gap-2">
                          <LogOut size={20}/>
                          ออกจากระบบ
                        </button>
                    </li>
                </ul>
              </Card>
            </div>
        </PageContainer>
    );
};


// --- BOTTOM NAVIGATION ---
const BottomNavigation: FC<NavigationProps> = ({ currentPage, onNavigate }) => {
  const navItems = [
    { name: 'Home', icon: Home, page: 'home' as Page },
    { name: 'Reports', icon: PieChart, page: 'reports' as Page },
    { name: 'Add', icon: Plus, page: 'add_transaction' as Page },
    { name: 'Profile', icon: User, page: 'profile' as Page },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 p-3">
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg shadow-2xl rounded-2xl flex justify-around items-center max-w-md mx-auto h-20">
        {navItems.map((item) => (
          item.name === 'Add' ? (
            <button
              key={item.name}
              onClick={() => onNavigate(item.page)}
              className="-mt-12 w-16 h-16 bg-indigo-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-indigo-600 transition"
            >
              <item.icon className="h-8 w-8" />
            </button>
          ) : (
            <button
              key={item.name}
              onClick={() => onNavigate(item.page)}
              className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
                currentPage === item.page
                  ? 'text-indigo-500 dark:text-indigo-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-indigo-500'
              }`}
            >
              <item.icon className="h-6 w-6" />
              <span className="text-xs mt-1">{item.name}</span>
            </button>
          )
        ))}
      </div>
    </div>
  );
};


// --- MAIN APP COMPONENT ---
export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('login');
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const renderPage = () => {
    const pageTransition = {
      initial: { opacity: 0, scale: 0.98 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.98 },
      transition: { duration: 0.3 }
    };

    return (
      <AnimatePresence mode="wait">
        <motion.div key={currentPage} {...pageTransition}>
          {
            {
              'login': <LoginPage onLoginSuccess={() => setCurrentPage('home')} />,
              'home': <HomePage onNavigate={setCurrentPage} />,
              'add_transaction': <AddTransactionPage onNavigate={setCurrentPage} />,
              'reports': <ReportsPage onNavigate={setCurrentPage} />,
              'profile': <ProfilePage onNavigate={setCurrentPage} isDarkMode={isDarkMode} toggleDarkMode={() => setIsDarkMode(!isDarkMode)} />,
            }[currentPage]
          }
        </motion.div>
      </AnimatePresence>
    );
  };

  return (
    <main>
      {renderPage()}
      {currentPage !== 'login' && (
        <BottomNavigation currentPage={currentPage} onNavigate={setCurrentPage} />
      )}
    </main>
  );
}