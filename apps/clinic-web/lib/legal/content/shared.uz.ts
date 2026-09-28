import type { LegalContext } from '../types';

/** "DENTA.UZ platformasi operatori (<legal name>)" or a neutral fallback. */
export function operatorLabelUz(ctx: LegalContext): string {
  return ctx.operator.legalName
    ? `${ctx.brand} platformasi operatori — ${ctx.operator.legalName}`
    : `${ctx.brand} platformasi operatori`;
}

/** Contact lines built only from configured values. */
export function contactLinesUz(ctx: LegalContext, preferPrivacy = false): string[] {
  const { operator } = ctx;
  const lines: string[] = [];
  if (operator.legalName) lines.push(`Operator: ${operator.legalName}`);
  if (operator.tin) lines.push(`STIR: ${operator.tin}`);
  if (operator.legalAddress) lines.push(`Yuridik manzil: ${operator.legalAddress}`);
  const email = preferPrivacy ? operator.privacyEmail : operator.supportEmail;
  if (email) {
    lines.push(
      preferPrivacy
        ? `Shaxsga doir ma’lumotlar bo‘yicha murojaatlar: ${email}`
        : `Qo‘llab-quvvatlash xizmati: ${email}`,
    );
  }
  if (preferPrivacy && operator.supportEmail && operator.supportEmail !== email) {
    lines.push(`Qo‘llab-quvvatlash xizmati: ${operator.supportEmail}`);
  }
  if (operator.supportPhone) lines.push(`Telefon: ${operator.supportPhone}`);
  if (lines.length === 0) {
    lines.push(
      `Murojaatlar ${ctx.brand} rasmiy veb-sayti va Platforma interfeysida e’lon qilingan aloqa kanallari orqali qabul qilinadi.`,
    );
  }
  return lines;
}
