'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { useAuthStore, useNotificationStore } from '@/store/supabaseStore';
import {
  LayoutDashboard,
  Briefcase,
  ClipboardList,
  FileText,
  MessageSquare,
  User,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useState } from 'react';

const navItems = [
  { key: 'dashboard', href: '/dashboard', icon: LayoutDashboard },
  { key: 'opportunities', href: '/opportunities', icon: Briefcase },
  { key: 'onboarding', href: '/onboarding', icon: ClipboardList },
  { key: 'documents', href: '/documents', icon: FileText },
  { key: 'messages', href: '/messages', icon: MessageSquare },
];

const bottomNavItems = [
  { key: 'profile', href: '/profile', icon: User },
  { key: 'settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { t, language, setLanguage } = useTranslation();
  const { profile, signOut } = useAuthContext();
  const { agent } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const [collapsed, setCollapsed] = useState(false);

  const getInitials = () => {
    if (!profile) return 'A';
    return `${profile.first_name[0]}${profile.last_name[0]}`;
  };

  return (
    <aside
      className={cn(
        'flex flex-col bg-zinc-900 text-white transition-all duration-300 h-screen sticky top-0',
        collapsed ? 'w-[72px]' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-800">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-lg flex items-center justify-center font-bold text-sm">
              AP
            </div>
            <span className="font-semibold text-lg">AgentHub</span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="text-zinc-400 hover:text-white hover:bg-zinc-800"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </Button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          const showBadge = item.key === 'messages' && unreadCount > 0;

          return (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all relative',
                isActive
                  ? 'bg-gradient-to-r from-teal-500/20 to-cyan-500/20 text-teal-400 border-l-2 border-teal-400'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              )}
            >
              <Icon size={20} />
              {!collapsed && (
                <>
                  <span className="text-sm font-medium">{t('nav', item.key)}</span>
                  {showBadge && (
                    <Badge className="ml-auto bg-teal-500 text-white text-xs px-1.5 py-0.5">
                      {unreadCount}
                    </Badge>
                  )}
                </>
              )}
              {collapsed && showBadge && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-teal-500 rounded-full text-[10px] flex items-center justify-center">
                  {unreadCount}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Navigation */}
      <div className="py-4 px-2 space-y-1 border-t border-zinc-800">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all',
                isActive
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              )}
            >
              <Icon size={20} />
              {!collapsed && <span className="text-sm font-medium">{t('nav', item.key)}</span>}
            </Link>
          );
        })}

        {/* Language Toggle */}
        <button
          onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-zinc-400 hover:text-white hover:bg-zinc-800 w-full"
        >
          <Globe size={20} />
          {!collapsed && (
            <span className="text-sm font-medium">
              {language === 'en' ? 'Español' : 'English'}
            </span>
          )}
        </button>

        {/* Logout */}
        <button
          onClick={signOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-zinc-400 hover:text-red-400 hover:bg-zinc-800 w-full"
        >
          <LogOut size={20} />
          {!collapsed && <span className="text-sm font-medium">{t('nav', 'logout')}</span>}
        </button>
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-zinc-800">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 w-full hover:bg-zinc-800 rounded-lg p-2 transition-all">
              <Avatar className="h-9 w-9 bg-gradient-to-br from-teal-400 to-cyan-500">
                <AvatarFallback className="bg-transparent text-white font-medium text-sm">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              {!collapsed && profile && (
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-white">
                    {profile.first_name} {profile.last_name}
                  </p>
                  <p className="text-xs text-zinc-400 truncate">{profile.email}</p>
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem asChild>
              <Link href="/profile">
                <User className="mr-2 h-4 w-4" />
                {t('nav', 'profile')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <Settings className="mr-2 h-4 w-4" />
                {t('nav', 'settings')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut} className="text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              {t('nav', 'logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
