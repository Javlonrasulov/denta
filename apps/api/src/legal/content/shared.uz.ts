import type { LegalContext } from '../legal.types';

/** "ORADENT platformasi operatori (<legal name>)" or a neutral fallback. */
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
      `Murojaat uchun aloqa ma’lumotlari ${ctx.brand} rasmiy veb-saytida (${ctx.domain}) e’lon qilinadi.`,
    );
  }
  return lines;
}
