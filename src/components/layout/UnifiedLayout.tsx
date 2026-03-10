'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Briefcase,
  FileText,
  User,
  LogOut,
  Menu,
  ChevronRight,
  ClipboardList,
  Settings,
  HelpCircle,
  ChevronDown,
  Users,
  BarChart3,
  Shield,
  UserPlus,
  Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface UnifiedLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function UnifiedLayout({ children, title }: UnifiedLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { profile, agent, isLoading, isAuthenticated, signOut } = useAuthContext();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAdmin = profile?.role === 'admin' || profile?.role === 'recruiter';

  useEffect(() => {
    let redirectTimeout: ReturnType<typeof setTimeout> | null = null;

    if (!isLoading && !isAuthenticated) {
      redirectTimeout = setTimeout(() => {
        router.push('/login');
      }, 100);
    }

    return () => {
      if (redirectTimeout) {
        clearTimeout(redirectTimeout);
      }
    };
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !profile) {
    return null;
  }

  // Navigation items based on role
  const agentNavItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/opportunities', label: 'Opportunities', icon: Briefcase },
    { href: '/applications', label: 'My Applications', icon: ClipboardList },
    { href: '/onboarding', label: 'Onboarding', icon: FileText },
    { href: '/profile', label: 'Profile', icon: User },
  ];

  const adminNavItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/agents', label: 'Agents', icon: Users },
    { href: '/opportunities', label: 'Opportunities', icon: Briefcase },
    { href: '/recruiters', label: 'Recruiters', icon: UserPlus },
    { href: '/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  const navItems = isAdmin ? adminNavItems : agentNavItems;

  const handleLogout = async () => {
    await signOut();
  };

  const initials = `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase();

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-b border-zinc-200">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white",
            isAdmin
              ? "bg-gradient-to-br from-cyan-400 to-teal-500"
              : "bg-gradient-to-br from-teal-400 to-cyan-500"
          )}>
            {isAdmin ? 'ATS' : 'AP'}
          </div>
          <div>
            <span className="text-xl font-bold text-zinc-900">AgentHub</span>
            {isAdmin && (
              <span className="text-zinc-400 text-xs block">Admin Portal</span>
            )}
          </div>
        </Link>
      </div>

      {/* Role Badge */}
      <div className="px-4 py-3 border-b border-zinc-100">
        <Badge
          variant="secondary"
          className={cn(
            "w-full justify-center py-1",
            profile.role === 'admin'
              ? 'bg-cyan-100 text-cyan-700'
              : profile.role === 'recruiter'
              ? 'bg-teal-100 text-teal-700'
              : 'bg-emerald-100 text-emerald-700'
          )}
        >
          {profile.role === 'admin' && <><Shield className="h-3 w-3 mr-1" />Administrator</>}
          {profile.role === 'recruiter' && <><UserPlus className="h-3 w-3 mr-1" />Recruiter</>}
          {profile.role === 'agent' && <><User className="h-3 w-3 mr-1" />Agent</>}
        </Badge>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                isActive
                  ? isAdmin
                    ? 'bg-cyan-50 text-cyan-700'
                    : 'bg-teal-50 text-teal-700'
                  : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
              {isActive && <ChevronRight className="h-4 w-4 ml-auto" />}
            </Link>
          );
        })}
      </nav>

      {/* Support */}
      <div className="p-4 border-t border-zinc-200">
        <a
          href="mailto:support@agenthub.com"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-all duration-200"
        >
          <HelpCircle className="h-5 w-5" />
          <span className="font-medium">Support</span>
        </a>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-zinc-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-white border-r border-zinc-200">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-white border-b border-zinc-200">
          <div className="flex items-center justify-between px-4 py-3 lg:px-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              {title && (
                <h1 className="text-lg font-semibold text-zinc-900">{title}</h1>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Notifications - only for admin */}
              {isAdmin && (
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5 text-zinc-600" />
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
                    3
                  </span>
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 hover:bg-zinc-100">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium",
                      isAdmin
                        ? "bg-gradient-to-br from-cyan-400 to-teal-500"
                        : "bg-gradient-to-br from-teal-400 to-cyan-500"
                    )}>
                      {initials}
                    </div>
                    <span className="hidden sm:block text-sm font-medium text-zinc-700">
                      {profile.first_name}
                    </span>
                    <ChevronDown className="h-4 w-4 text-zinc-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center text-white font-medium",
                        isAdmin
                          ? "bg-gradient-to-br from-cyan-400 to-teal-500"
                          : "bg-gradient-to-br from-teal-400 to-cyan-500"
                      )}>
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-zinc-900">
                          {profile.first_name} {profile.last_name}
                        </p>
                        <p className="text-xs text-zinc-500 truncate">{profile.email}</p>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center cursor-pointer">
                      <User className="h-4 w-4 mr-2" />
                      My Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="flex items-center cursor-pointer">
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
