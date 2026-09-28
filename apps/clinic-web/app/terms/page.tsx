import type { Metadata } from 'next';

import { LegalDocumentView } from '@/components/legal/LegalDocumentView';

export const metadata: Metadata = {
  title: { absolute: 'ORADENT Foydalanish shartlari' },
  description: 'ORADENT platformasidan foydalanish shartlari: sinov davri, obuna, to‘lovlar, rollar va javobgarlik.',
  alternates: { canonical: '/terms' },
};

export default function TermsPage() {
  return <LegalDocumentView kind="terms" />;
}
