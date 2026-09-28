import type { Metadata } from 'next';

import { LegalDocumentView } from '@/components/legal/LegalDocumentView';

export const metadata: Metadata = {
  title: { absolute: 'ORADENT Maxfiylik siyosati' },
  description: 'ORADENT platformasida shaxsga doir va tibbiy ma’lumotlar qanday qayta ishlanishi va himoya qilinishi.',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return <LegalDocumentView kind="privacy" />;
}
