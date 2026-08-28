import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuthStore } from '../../store/authStore';
import { useEmailStore } from '../../store/emailStore';
import NotificationsDrawer from './NotificationsDrawer';
import ComposeModal from '../ComposeModal';
import api from '../../services/api';
import {
  Inbox,
  Star,
  Send,
  Archive,
  Trash2,
  Briefcase,
  User,
  Sparkles,
  Tag,
  ShieldCheck,
  Activity,
  Settings,
  Plus,
  Search,
  Bell,
  LogOut,
  LayoutDashboard,
  RefreshCw,
  Mail,
  Menu,
  X,
  ChevronDown,
  Layers,
} from 'lucide-react';

export default function AppShell({ children }) {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const {
    activeFolder,
    setActiveFolder,
    activeCategory,
    setActiveCategory,
    searchQuery,
    setSearchQuery,
    openCompose,
    setNotificationsOpen,
    unreadNotificationsCount,
    setNotifications,
    accounts,
    setAccounts,
    unreadCount,
    setUnreadCount,
  } = useEmailStore();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(searchQuery || '');
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // Load initial accounts & notifications & stats
    const loadInitData = async () => {
      try {
        const [accRes, notifRes, statsRes] = await Promise.allSettled([
          api.get('/email-accounts'),
          api.get('/notifications?unreadOnly=true'),
          api.get('/emails/stats'),
        ]);

        if (accRes.status === 'fulfilled' && accRes.value.data?.accounts) {
          setAccounts(accRes.value.data.accounts);
        }
        if (notifRes.status === 'fulfilled' && notifRes.value.data) {
          setNotifications(notifRes.value.data);
        }
        if (statsRes.status === 'fulfilled' && statsRes.value.data) {
          setUnreadCount(statsRes.value.data.unreadCount || 0);
        }
      } catch (e) {
        console.error('Failed to load init shell data:', e);
      }
    };

    loadInitData();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchQuery(searchInput);
    if (!router.pathname.startsWith('/inbox')) {
      router.push('/inbox');
    }
  };

  const handleSyncAll = async () => {
    if (accounts.length === 0) {
      router.push('/accounts');
      return;
    }
    try {
      setIsSyncing(true);
      for (const acc of accounts) {
        if (acc.isConnected) {
          await api.post(`/email-accounts/${acc._id}/sync`);
        }
      }
      const statsRes = await api.get('/emails/stats');
      if (statsRes.data) {
        setUnreadCount(statsRes.data.unreadCount || 0);
      }
      // If currently on inbox page, trigger reload/push
      if (router.pathname === '/inbox') {
        router.replace(router.asPath);
      }
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Inbox', href: '/inbox', icon: Inbox, badge: unreadCount },
    { label: 'Accounts', href: '/accounts', icon: Mail, badge: accounts.length ? `${accounts.length}` : '!' },
    { label: 'Activity Log', href: '/activity', icon: Activity },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  const folderItems = [
    { id: 'inbox', label: 'Inbox', icon: Inbox, count: unreadCount },
    { id: 'starred', label: 'Starred', icon: Star },
    { id: 'sent', label: 'Sent', icon: Send },
    { id: 'archive', label: 'Archive', icon: Archive },
    { id: 'trash', label: 'Trash', icon: Trash2 },
  ];

  const categoryItems = [
    { id: 'work', label: 'Work', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30' },
    { id: 'personal', label: 'Personal', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
    { id: 'updates', label: 'Updates', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
    { id: 'promotions', label: 'Promotions', color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' },
  ];

  const handleFolderClick = (folderId) => {
    setActiveFolder(folderId);
    if (router.pathname !== '/inbox') {
      router.push('/inbox');
    }
  };

  const handleCategoryClick = (catId) => {
    if (activeCategory === catId) {
      setActiveCategory(null);
    } else {
      setActiveCategory(catId);
    }
    if (router.pathname !== '/inbox') {
      router.push('/inbox');
    }
  };

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col antialiased">
      {/* Top Navbar */}
      <header className="h-16 bg-[#0E1526]/90 border-b border-slate-800/80 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-400 hover:text-white lg:hidden rounded-lg hover:bg-slate-800"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 via-brand-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
                MailSense <span className="text-xs bg-brand-500/20 text-brand-400 border border-brand-500/30 px-1.5 py-0.2 rounded font-semibold">AI</span>
              </span>
              <span className="text-[10px] text-slate-400 tracking-wider uppercase font-medium">
                Intelligent Email Assistant
              </span>
            </div>
          </Link>
        </div>

        {/* Global Search Bar */}
        <div className="flex-1 max-w-xl mx-4 hidden md:block">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search emails by sender, subject, keywords..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  setSearchQuery('');
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-300"
              >
                Clear
              </button>
            )}
          </form>
        </div>

        {/* Top Right Actions */}
        <div className="flex items-center gap-3">
          {/* Quick Compose Button */}
          <button
            onClick={() => openCompose()}
            className="flex items-center gap-2 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white px-3.5 py-2 rounded-xl text-sm font-medium shadow-md shadow-brand-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Compose</span>
          </button>

          {/* Sync Button */}
          <button
            onClick={handleSyncAll}
            disabled={isSyncing}
            title="Sync inbox with Gmail"
            className="p-2 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 rounded-xl transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-brand-400' : ''}`} />
          </button>

          {/* Notifications Bell */}
          <button
            onClick={() => setNotificationsOpen(true)}
            className="relative p-2 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 rounded-xl transition-all"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-[#0E1526] animate-pulse">
                {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
              </span>
            )}
          </button>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-800/80 border border-transparent hover:border-slate-700/60 transition-all text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-brand-400 font-bold text-sm">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="hidden xl:flex flex-col">
                <span className="text-xs font-semibold text-slate-200 leading-tight">
                  {user?.name || 'Operator'}
                </span>
                <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                  {user?.email}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>

            {userDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 glass-dropdown rounded-xl p-1.5 z-50 animate-fade-in">
                <div className="px-3 py-2 border-b border-slate-800 mb-1">
                  <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                </div>
                <Link
                  href="/accounts"
                  onClick={() => setUserDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-lg transition-colors"
                >
                  <Mail className="w-4 h-4 text-brand-400" />
                  Connected Accounts
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setUserDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-lg transition-colors"
                >
                  <Settings className="w-4 h-4 text-indigo-400" />
                  Settings & Health
                </Link>
                <div className="border-t border-slate-800 my-1" />
                <button
                  onClick={() => {
                    setUserDropdownOpen(false);
                    logout();
                    router.push('/login');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors text-left"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Layout Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 pt-16 z-30 w-64 bg-[#0B101D] border-r border-slate-800/80 flex flex-col justify-between transition-transform duration-300 lg:translate-x-0 lg:static lg:pt-0 ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="p-4 space-y-6 overflow-y-auto flex-1">
            {/* Primary Navigation */}
            <div>
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                Navigation
              </p>
              <div className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.href === '/inbox'
                      ? router.pathname.startsWith('/inbox')
                      : router.pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-brand-600/15 text-brand-400 border border-brand-500/25 font-semibold'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-brand-400' : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Email Folders */}
            <div>
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                Folders
              </p>
              <div className="space-y-1">
                {folderItems.map((folder) => {
                  const Icon = folder.icon;
                  const isSelected = activeFolder === folder.id && !activeCategory;
                  return (
                    <button
                      key={folder.id}
                      onClick={() => {
                        handleFolderClick(folder.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all text-left ${
                        isSelected
                          ? 'bg-slate-800 text-white font-semibold'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-3.5 h-3.5 text-slate-400" />
                        <span>{folder.label}</span>
                      </div>
                      {folder.count !== undefined && folder.count > 0 && (
                        <span className="text-[11px] font-bold text-brand-400">{folder.count}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* AI Smart Categories */}
            <div>
              <div className="px-3 flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-indigo-400" />
                  AI Categories
                </p>
              </div>
              <div className="space-y-1">
                {categoryItems.map((cat) => {
                  const isSelected = activeCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        handleCategoryClick(cat.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all text-left ${
                        isSelected
                          ? 'bg-indigo-950/40 border border-indigo-500/40 text-indigo-200 font-semibold'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Tag className="w-3.5 h-3.5 text-slate-400" />
                        <span>{cat.label}</span>
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border ${cat.color}`}>
                        AI
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Account status badge in bottom sidebar */}
          <div className="p-4 border-t border-slate-800/80 bg-slate-900/40">
            <Link
              href="/accounts"
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 transition-all text-left"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <div className="truncate">
                  <p className="text-xs font-semibold text-slate-200 truncate">
                    {accounts.length > 0
                      ? accounts[0].emailAddress
                      : 'No Account Connected'}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {accounts.length > 0
                      ? accounts[0].isSandbox
                        ? 'Sandbox Mode Active'
                        : 'Gmail OAuth Connected'
                      : 'Click to connect'}
                  </p>
                </div>
              </div>
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 ml-1" />
            </Link>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 flex flex-col overflow-y-auto bg-[#090D16] min-w-0">
          {children}
        </main>
      </div>

      {/* Global Notifications Drawer & Compose Modal */}
      <NotificationsDrawer />
      <ComposeModal />
    </div>
  );
}
