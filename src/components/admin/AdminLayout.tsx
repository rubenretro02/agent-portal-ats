'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAdminStore } from '@/store/adminStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  FileText,
  BarChart3,
  Settings,
  Bell,
  LogOut,
  ChevronDown,
  Shield,
  UserPlus,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser, isAuthenticated, isLoading, permissions, logout, hasPermission, checkSession } = useAdminStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  useEffect(() => {
    const doCheck = async () => {
      await checkSession();
      setInitialCheckDone(true);
    };
    doCheck();
  }, [checkSession]);

  useEffect(() => {
    // Only redirect after initial check is complete
    if (initialCheckDone && !isLoading && !isAuthenticated) {
      router.push('/admin/login');
    }
  }, [initialCheckDone, isLoading, isAuthenticated, router]);

  if (!initialCheckDone || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !currentUser) {
    return null;
  }

  const navItems = [
    {
      key: 'dashboard',
      href: '/admin',
      icon: LayoutDashboard,
      label: 'Dashboard',
      show: true
    },
    {
      key: 'agents',
      href: '/admin/agents',
      icon: Users,
      label: 'Agents',
      show: hasPermission('canViewAgents')
    },
    {
      key: 'opportunities',
      href: '/admin/opportunities',
      icon: Briefcase,
      label: 'Opportunities',
      show: hasPermission('canViewCampaigns')
    },
    {
      key: 'documents',
      href: '/admin/documents',
      icon: FileText,
      label: 'Documents',
      show: hasPermission('canApproveDocuments')
    },
    {
      key: 'recruiters',
      href: '/admin/recruiters',
      icon: UserPlus,
      label: 'Recruiters',
      show: hasPermission('canViewRecruiters')
    },
    {
      key: 'analytics',
      href: '/admin/analytics',
      icon: BarChart3,
      label: 'Analytics',
      show: hasPermission('canViewAnalytics')
    },
    {
      key: 'settings',
      href: '/admin/settings',
      icon: Settings,
      label: 'Settings',
      show: hasPermission('canManageSettings')
    },
  ].filter(item => item.show);

  const handleLogout = async () => {
    await logout();
    router.push('/admin/login');
  };

  const getInitials = () => {
    return `${currentUser.firstName[0] || ''}${currentUser.lastName[0] || ''}`.toUpperCase();
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Mobile Menu */}
            <div className="flex items-center gap-4">
              <button
                className="lg:hidden p-2 rounded-lg hover:bg-zinc-100"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>

              <Link href="/admin" className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-to-br from-cyan-400 to-teal-500 rounded-lg flex items-center justify-center font-bold text-white text-sm">
                  ATS
                </div>
                <div className="hidden sm:block">
                  <span className="font-semibold text-zinc-900">AgentHub</span>
                  <span className="text-zinc-400 text-xs block">Admin Portal</span>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href ||
                  (item.href !== '/admin' && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-cyan-50 text-cyan-700'
                        : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Right Side */}
            <div className="flex items-center gap-3">
              {/* Notifications */}
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5 text-zinc-600" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
                  3
                </span>
              </Button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-zinc-100 transition-colors">
                    <Avatar className="h-8 w-8 bg-gradient-to-br from-cyan-400 to-teal-500">
                      <AvatarFallback className="bg-transparent text-white text-xs font-medium">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden sm:block text-left">
                      <p className="text-sm font-medium text-zinc-900">
                        {currentUser.firstName} {currentUser.lastName}
                      </p>
                      <div className="flex items-center gap-1">
                        <Badge
                          variant="secondary"
                          className={cn(
                            'text-[10px] px-1.5 py-0',
                            currentUser.role === 'admin'
                              ? 'bg-cyan-100 text-cyan-700'
                              : 'bg-teal-100 text-teal-700'
                          )}
                        >
                          {currentUser.role === 'admin' ? (
                            <><Shield className="h-2.5 w-2.5 mr-0.5" />Admin</>
                          ) : (
                            <>Recruiter</>
                          )}
                        </Badge>
                      </div>
                    </div>
                    <ChevronDown className="h-4 w-4 text-zinc-400 hidden sm:block" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div>
                      <p className="font-medium">{currentUser.firstName} {currentUser.lastName}</p>
                      <p className="text-xs text-zinc-500">{currentUser.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/admin/settings">
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="h-4 w-4 mr-2" />
                    Log Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-zinc-200 bg-white">
            <nav className="px-4 py-2 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href ||
                  (item.href !== '/admin' && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-cyan-50 text-cyan-700'
                        : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>
    </div>
  );
}
