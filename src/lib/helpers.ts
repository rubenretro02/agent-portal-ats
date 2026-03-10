import { PIPELINE_STAGES, DOCUMENT_TYPES } from './constants';
import type { PipelineStatus, DocumentType, Language } from '@/types';

export function getPipelineStageLabel(status: PipelineStatus, language: Language): string {
  const stage = PIPELINE_STAGES.find(s => s.status === status);
  if (!stage) return status;
  return language === 'es' ? stage.label.es : stage.label.en;
}

export function getDocumentTypeLabel(type: DocumentType, language: Language): string {
  const doc = DOCUMENT_TYPES.find(d => d.type === type);
  if (!doc) return type;
  return language === 'es' ? doc.label.es : doc.label.en;
}

export function getPipelineStageColor(status: PipelineStatus): string {
  const stage = PIPELINE_STAGES.find(s => s.status === status);
  return stage?.color || '#6B7280';
}
