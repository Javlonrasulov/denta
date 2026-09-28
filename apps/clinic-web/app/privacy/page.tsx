import type { Metadata } from 'next';

import { LegalDocumentView } from '@/components/legal/LegalDocumentView';

export const metadata: Metadata = {
  title: 'Maxfiylik siyosati — DENTA.UZ',
  description: 'DENTA.UZ platformasida shaxsga doir va tibbiy ma’lumotlar qanday qayta ishlanishi va himoya qilinishi.',
};

export default function PrivacyPage() {
  return <LegalDocumentView kind="privacy" />;
}
