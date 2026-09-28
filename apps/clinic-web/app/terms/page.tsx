import type { Metadata } from 'next';

import { LegalDocumentView } from '@/components/legal/LegalDocumentView';

export const metadata: Metadata = {
  title: 'Foydalanish shartlari — DENTA.UZ',
  description: 'DENTA.UZ platformasidan foydalanish shartlari: sinov davri, obuna, to‘lovlar, rollar va javobgarlik.',
};

export default function TermsPage() {
  return <LegalDocumentView kind="terms" />;
}
