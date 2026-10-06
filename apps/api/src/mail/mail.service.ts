import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('app.smtp.host');
    if (host) {
      this.transporter = nodemailer.createTransport({
        host,
        port: this.config.get<number>('app.smtp.port') ?? 587,
        secure: this.config.get<boolean>('app.smtp.secure') ?? false,
        auth: this.config.get<string>('app.smtp.user')
          ? {
              user: this.config.get<string>('app.smtp.user'),
              pass: this.config.get<string>('app.smtp.password'),
            }
          : undefined,
      });
    }
  }

  async sendMail(opts: {
    to: string;
    subject: string;
    text: string;
    html?: string;
  }): Promise<void> {
    const from =
      this.config.get<string>('app.smtp.from') ??
      'ORADENT <no-reply@oradent.uz>';
    const support =
      this.config.get<string>('app.supportEmail') ?? 'support@oradent.uz';

    if (!this.transporter) {
      this.logger.warn(
        `SMTP not configured — email to ${opts.to} skipped (subject: ${opts.subject})`,
      );
      return;
    }

    const footerText = `\n\n—\nORADENT · https://oradent.uz\nYordam: ${support}`;
    const footerHtml = `<hr style="border:none;border-top:1px solid #E5E7EB;margin:28px 0 14px" /><p style="margin:0;color:#6B7280;font-size:14px;line-height:1.6">ORADENT · <a href="https://oradent.uz" style="color:#4338CA">oradent.uz</a><br />Yordam: <a href="mailto:${support}" style="color:#4338CA">${support}</a></p>`;
    const body = opts.html ?? `<p style="margin:0 0 12px">${opts.text}</p>`;

    // BullMQ queue integration will wrap this; sync send for MVP.
    await this.transporter.sendMail({
      from,
      replyTo: support,
      to: opts.to,
      subject: opts.subject,
      text: opts.text + footerText,
      html: `<div style="font-family:Arial,Helvetica,sans-serif;font-size:17px;line-height:1.6;color:#111827;max-width:520px">${body}${footerHtml}</div>`,
    });
  }

  private otpHtml(title: string, code: string): string {
    return [
      `<p style="margin:0 0 8px;font-size:20px;font-weight:700">${title}</p>`,
      `<div style="margin:16px 0;padding:20px 16px;background:#EEF2FF;border:1px solid #C7D2FE;border-radius:14px;text-align:center">`,
      `<span style="font-family:Consolas,'Courier New',monospace;font-size:40px;font-weight:700;letter-spacing:10px;color:#1E1B4B;user-select:all;-webkit-user-select:all">${code}</span>`,
      `</div>`,
      `<p style="margin:0 0 6px;font-size:15px;color:#4B5563">Nusxalash uchun kod ustiga ikki marta bosing (telefonda — bosib turing).</p>`,
      `<p style="margin:0;font-size:17px">Amal qilish muddati: <strong>10 daqiqa</strong>.</p>`,
    ].join('');
  }

  async sendVerificationOtp(email: string, code: string): Promise<void> {
    await this.sendMail({
      to: email,
      subject: `${code} — ORADENT email tasdiqlash kodi`,
      text: `Tasdiqlash kodi: ${code}\nAmal qilish muddati: 10 daqiqa.`,
      html: this.otpHtml('Email manzilingizni tasdiqlash kodi', code),
    });
  }

  async sendPasswordResetOtp(email: string, code: string): Promise<void> {
    await this.sendMail({
      to: email,
      subject: `${code} — ORADENT parolni tiklash kodi`,
      text: `Parolni tiklash kodi: ${code}\nAmal qilish muddati: 10 daqiqa.`,
      html: this.otpHtml('Parolni tiklash kodi', code),
    });
  }

  async sendEmailChangeOtp(email: string, code: string): Promise<void> {
    await this.sendMail({
      to: email,
      subject: `${code} — ORADENT yangi emailni tasdiqlash kodi`,
      text: `Yangi email manzilini tasdiqlash kodi: ${code}\nAmal qilish muddati: 10 daqiqa.\nAgar bu so‘rovni siz yubormagan bo‘lsangiz, xabarni e’tiborsiz qoldiring.`,
      html: this.otpHtml('Yangi emailni tasdiqlash kodi', code),
    });
  }

  async sendEmailChangedNotice(oldEmail: string, newEmail: string): Promise<void> {
    await this.sendMail({
      to: oldEmail,
      subject: 'ORADENT — akkaunt emaili o‘zgartirildi',
      text: `Akkauntingiz emaili ${newEmail} manziliga o‘zgartirildi. Agar buni siz qilmagan bo‘lsangiz, darhol qo‘llab-quvvatlash xizmatiga murojaat qiling.`,
    });
  }

  async sendClinicInvitation(opts: {
    to: string;
    clinicName: string;
    inviteeName: string;
    role: string;
    acceptUrl: string;
    expiresAt: Date;
  }): Promise<void> {
    const expires = opts.expiresAt.toISOString().slice(0, 16).replace('T', ' ');
    const esc = (s: string) =>
      s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    await this.sendMail({
      to: opts.to,
      subject: `ORADENT — ${opts.clinicName} klinikaga taklif`,
      text: [
        `Salom ${opts.inviteeName},`,
        ``,
        `Sizni ${opts.clinicName} klinikaga (${opts.role}) sifatida taklif qilishdi.`,
        `Taklifni qabul qilish: ${opts.acceptUrl}`,
        `Amal qilish muddati: ${expires}`,
      ].join('\n'),
      html: `
        <p>Salom <strong>${esc(opts.inviteeName)}</strong>,</p>
        <p>Sizni <strong>${esc(opts.clinicName)}</strong> klinikaga (<em>${esc(opts.role)}</em>) sifatida taklif qilishdi.</p>
        <p><a href="${esc(opts.acceptUrl)}">Taklifni qabul qilish</a></p>
        <p>Amal qilish muddati: ${expires}</p>
      `,
    });
  }

  async sendExistingUserClinicInvite(opts: {
    to: string;
    clinicName: string;
    inviteeName: string;
    role: string;
    acceptUrl: string;
    expiresAt: Date;
  }): Promise<void> {
    await this.sendClinicInvitation(opts);
  }
}
