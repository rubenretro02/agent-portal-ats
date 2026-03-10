'use client';

import { useAuthStore, useNotificationStore } from '@/store';
import { useTranslation } from '@/hooks/useTranslation';
import { Bell, Search, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { es, enUS } from 'date-fns/locale';

interface HeaderProps {
  title?: string;
  onMenuClick?: () => void;
}

export function Header({ title, onMenuClick }: HeaderProps) {
  const { agent } = useAuthStore();
  const { notifications, unreadCount, markAsRead } = useNotificationStore();
  const { t, language } = useTranslation();

  const dateLocale = language === 'es' ? es : enUS;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'status_change':
        return '🔄';
      case 'document_approved':
        return '✅';
      case 'campaign_available':
        return '📋';
      case 'message':
        return '💬';
      case 'reminder':
        return '⏰';
      default:
        return '📢';
    }
  };

  return (
    <header className="h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-6 sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuClick}
        >
          <Menu size={20} />
        </Button>
        {title && (
          <h1 className="text-xl font-semibold text-zinc-900">{title}</h1>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="hidden md:flex relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 h-4 w-4" />
          <Input
            placeholder={language === 'es' ? 'Buscar...' : 'Search...'}
            className="pl-9 w-64 bg-zinc-50 border-zinc-200"
          />
        </div>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell size={20} className="text-zinc-600" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-teal-500 text-white text-xs">
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>{language === 'es' ? 'Notificaciones' : 'Notifications'}</span>
              {unreadCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {unreadCount} {language === 'es' ? 'nuevas' : 'new'}
                </Badge>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <ScrollArea className="h-[300px]">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-zinc-500 text-sm">
                  {t('dashboard', 'noNotifications')}
                </div>
              ) : (
                notifications.map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className="flex flex-col items-start p-3 cursor-pointer"
                    onClick={() => markAsRead(notification.id, 'notification')}
                  >
                    <div className="flex items-start gap-2 w-full">
                      <span className="text-lg">
                        {getNotificationIcon(notification.type)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${!notification.read ? 'font-semibold' : ''}`}>
                          {notification.title}
                        </p>
                        <p className="text-xs text-zinc-500 truncate">
                          {notification.message}
                        </p>
                        <p className="text-xs text-zinc-400 mt-1">
                          {formatDistanceToNow(new Date(notification.createdAt), {
                            addSuffix: true,
                            locale: dateLocale,
                          })}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-teal-500 rounded-full mt-1.5" />
                      )}
                    </div>
                  </DropdownMenuItem>
                ))
              )}
            </ScrollArea>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Agent Status Indicator */}
        {agent && (
          <div className="hidden sm:flex items-center gap-2 pl-4 border-l border-zinc-200">
            <div className="flex flex-col items-end">
              <span className="text-sm font-medium text-zinc-900">
                {agent.firstName} {agent.lastName}
              </span>
              <span className="text-xs text-zinc-500">
                ATS: {agent.atsId}
              </span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
