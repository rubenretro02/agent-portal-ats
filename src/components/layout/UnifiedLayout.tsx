'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthContext } from '@/components/providers/AuthProvider';
import BrandMark from '@/components/BrandMark';
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
  Mail,
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
        router.push('/');
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading...</p>
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
    { href: '/mail', label: 'Agent Mail', icon: Mail },
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
      <div className="p-4 border-b border-border">
        <BrandMark href="/dashboard" subtitle={isAdmin ? 'Admin Portal' : undefined} />
      </div>

      {/* Role Badge */}
      <div className="px-4 py-3 border-b border-border">
        <Badge
          variant="secondary"
          className={cn(
            "w-full justify-center py-1",
            profile.role === 'admin'
              ? 'bg-[var(--brand-blue-soft)] text-[var(--brand-blue)]'
              : profile.role === 'recruiter'
              ? 'bg-[var(--brand-purple-soft)] text-[var(--brand-purple)]'
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
                  ? 'bg-accent text-accent-foreground font-semibold'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
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
      <div className="p-4 border-t border-border">
        <a
          href="mailto:support@wingcx.com"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-all duration-200"
        >
          <HelpCircle className="h-5 w-5" />
          <span className="font-medium">Support</span>
        </a>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-card border-r border-border">
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
        <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-md border-b border-border">
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
                <h1 className="text-lg font-semibold text-foreground">{title}</h1>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Notifications - only for admin */}
              {isAdmin && (
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5 text-muted-foreground" />
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
                    3
                  </span>
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 hover:bg-secondary">
                    <div className="w-8 h-8 rounded-full gradient-brand flex items-center justify-center text-white text-sm font-medium">
                      {initials}
                    </div>
                    <span className="hidden sm:block text-sm font-medium text-foreground">
                      {profile.first_name}
                    </span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full gradient-brand flex items-center justify-center text-white font-medium">
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">
                          {profile.first_name} {profile.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
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
