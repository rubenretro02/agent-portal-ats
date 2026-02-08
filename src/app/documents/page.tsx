'use client';

import { useState } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { useAuthStore } from '@/store';
import { useTranslation } from '@/hooks/useTranslation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DOCUMENT_TYPES } from '@/lib/constants';
import {
  FileText,
  Upload,
  Download,
  Eye,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  FileSignature,
  Shield,
  File,
  Plus,
} from 'lucide-react';
import type { Document, DocumentType, DocumentStatus } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { es, enUS } from 'date-fns/locale';

export default function DocumentsPage() {
  const { agent, updateAgent } = useAuthStore();
  const { t, language } = useTranslation();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<DocumentType>('w9');
  const [uploading, setUploading] = useState(false);

  const dateLocale = language === 'es' ? es : enUS;

  if (!agent) return null;

  const documents = agent.documents;
  const requiredDocs = DOCUMENT_TYPES.filter(d => d.required);
  const uploadedTypes = documents.map(d => d.type);
  const missingDocs = requiredDocs.filter(d => !uploadedTypes.includes(d.type));

  const approvedDocs = documents.filter(d => d.status === 'approved');
  const pendingDocs = documents.filter(d => d.status === 'pending');

  const getStatusBadge = (status: DocumentStatus) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-emerald-500 hover:bg-emerald-600">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            {t('documents', 'approved')}
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="secondary" className="bg-amber-100 text-amber-700">
            <Clock className="h-3 w-3 mr-1" />
            {t('documents', 'pending')}
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            {t('documents', 'rejected')}
          </Badge>
        );
      default:
        return null;
    }
  };

  const getDocumentLabel = (type: DocumentType) => {
    const doc = DOCUMENT_TYPES.find(d => d.type === type);
    return doc?.label[language] || type;
  };

  const handleUpload = async () => {
    setUploading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));

    const newDoc: Document = {
      id: `doc-${Date.now()}`,
      agentId: agent.id,
      type: selectedDocType,
      name: getDocumentLabel(selectedDocType),
      url: '#',
      status: 'pending',
      uploadedAt: new Date(),
    };

    updateAgent({ documents: [...agent.documents, newDoc] });
    setUploading(false);
    setUploadDialogOpen(false);
  };

  return (
    <PortalLayout title={t('documents', 'title')}>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-zinc-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-zinc-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{documents.length}</p>
                  <p className="text-xs text-zinc-500">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-zinc-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-600">{approvedDocs.length}</p>
                  <p className="text-xs text-zinc-500">{t('documents', 'approved')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-zinc-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-600">{pendingDocs.length}</p>
                  <p className="text-xs text-zinc-500">{t('documents', 'pending')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-zinc-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">{missingDocs.length}</p>
                  <p className="text-xs text-zinc-500">{language === 'es' ? 'Faltantes' : 'Missing'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Missing Documents Alert */}
        {missingDocs.length > 0 && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-amber-800 mb-2">
                    {language === 'es' ? 'Documentos requeridos faltantes' : 'Missing Required Documents'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {missingDocs.map(doc => (
                      <Badge key={doc.type} variant="secondary" className="bg-amber-100 text-amber-800">
                        {doc.label[language]}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Documents List */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{language === 'es' ? 'Mis Documentos' : 'My Documents'}</h2>
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-teal-500 hover:bg-teal-600">
                <Plus className="h-4 w-4 mr-2" />
                {t('documents', 'upload')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('documents', 'upload')}</DialogTitle>
                <DialogDescription>
                  {language === 'es' ? 'Selecciona el tipo de documento y sube tu archivo.' : 'Select document type and upload your file.'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>{language === 'es' ? 'Tipo de Documento' : 'Document Type'}</Label>
                  <Select value={selectedDocType} onValueChange={(v) => setSelectedDocType(v as DocumentType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DOCUMENT_TYPES.filter(d => !uploadedTypes.includes(d.type)).map(doc => (
                        <SelectItem key={doc.type} value={doc.type}>
                          {doc.label[language]} {doc.required && <span className="text-red-500">*</span>}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="border-2 border-dashed border-zinc-300 rounded-lg p-8 text-center hover:border-teal-400 transition-colors cursor-pointer">
                  <Upload className="h-8 w-8 text-zinc-400 mx-auto mb-2" />
                  <p className="text-sm text-zinc-600">
                    {language === 'es' ? 'Arrastra tu archivo aquí' : 'Drag your file here'}
                  </p>
                  <p className="text-xs text-zinc-400 mt-1">PDF, PNG, JPG (max 10MB)</p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>{t('common', 'cancel')}</Button>
                <Button onClick={handleUpload} disabled={uploading} className="bg-teal-500 hover:bg-teal-600">
                  {uploading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : t('documents', 'upload')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4">
          {documents.map((doc) => (
            <Card key={doc.id} className="border-zinc-200 hover:border-zinc-300 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0">
                    {doc.type === 'contract' ? <FileSignature className="h-6 w-6 text-zinc-600" /> :
                     doc.type === 'background_consent' ? <Shield className="h-6 w-6 text-zinc-600" /> :
                     <File className="h-6 w-6 text-zinc-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="font-medium text-zinc-900">{doc.name}</h4>
                      {getStatusBadge(doc.status)}
                    </div>
                    <p className="text-sm text-zinc-500">
                      {language === 'es' ? 'Subido' : 'Uploaded'}{' '}
                      {formatDistanceToNow(new Date(doc.uploadedAt), { addSuffix: true, locale: dateLocale })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon"><Download className="h-4 w-4" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </PortalLayout>
  );
}
