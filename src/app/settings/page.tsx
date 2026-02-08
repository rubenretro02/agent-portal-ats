'use client';

import { PortalLayout } from '@/components/layout/PortalLayout';
import { useAuthStore } from '@/store';
import { useTranslation } from '@/hooks/useTranslation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Globe, Bell, Shield, Moon, Monitor } from 'lucide-react';

export default function SettingsPage() {
  const { language, setLanguage } = useAuthStore();
  const { t } = useTranslation();

  return (
    <PortalLayout title={t('nav', 'settings')}>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Language Settings */}
        <Card className="border-zinc-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Globe className="h-5 w-5 text-zinc-400" />
              {language === 'es' ? 'Idioma' : 'Language'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>{language === 'es' ? 'Idioma del Portal' : 'Portal Language'}</Label>
              <Select value={language} onValueChange={(v) => setLanguage(v as 'en' | 'es')}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="border-zinc-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="h-5 w-5 text-zinc-400" />
              {language === 'es' ? 'Notificaciones' : 'Notifications'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>{language === 'es' ? 'Notificaciones por Email' : 'Email Notifications'}</Label>
                <p className="text-sm text-zinc-500">{language === 'es' ? 'Recibir actualizaciones por correo' : 'Receive updates via email'}</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>{language === 'es' ? 'Notificaciones SMS' : 'SMS Notifications'}</Label>
                <p className="text-sm text-zinc-500">{language === 'es' ? 'Alertas urgentes por SMS' : 'Urgent alerts via SMS'}</p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>{language === 'es' ? 'Nuevas Campañas' : 'New Campaigns'}</Label>
                <p className="text-sm text-zinc-500">{language === 'es' ? 'Alertar cuando hay nuevas campañas' : 'Alert when new campaigns available'}</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card className="border-zinc-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Monitor className="h-5 w-5 text-zinc-400" />
              {language === 'es' ? 'Apariencia' : 'Appearance'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>{language === 'es' ? 'Modo Oscuro' : 'Dark Mode'}</Label>
                <p className="text-sm text-zinc-500">{language === 'es' ? 'Cambiar tema del portal' : 'Toggle portal theme'}</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="border-zinc-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-zinc-400" />
              {language === 'es' ? 'Seguridad' : 'Security'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline">
              {language === 'es' ? 'Cambiar Contraseña' : 'Change Password'}
            </Button>
            <Button variant="outline">
              {language === 'es' ? 'Activar 2FA' : 'Enable 2FA'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
}
