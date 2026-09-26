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
      'DENTA <noreply@denta.uz>';

    if (!this.transporter) {
      this.logger.warn(
        `SMTP not configured — email to ${opts.to} skipped (subject: ${opts.subject})`,
      );
      return;
    }

    // BullMQ queue integration will wrap this; sync send for MVP.
    await this.transporter.sendMail({
      from,
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
      html: opts.html ?? `<p>${opts.text}</p>`,
    });
  }

  async sendVerificationOtp(email: string, code: string): Promise<void> {
    await this.sendMail({
      to: email,
      subject: 'DENTA — Email manzilingizni tasdiqlang',
      text: `Tasdiqlash kodi: ${code}\nAmal qilish muddati: 10 daqiqa.`,
      html: `<p>Tasdiqlash kodi: <strong>${code}</strong></p><p>Amal qilish muddati: 10 daqiqa.</p>`,
    });
  }

  async sendPasswordResetOtp(email: string, code: string): Promise<void> {
    await this.sendMail({
      to: email,
      subject: 'DENTA — Parolni tiklash',
      text: `Parolni tiklash kodi: ${code}\nAmal qilish muddati: 10 daqiqa.`,
      html: `<p>Parolni tiklash kodi: <strong>${code}</strong></p><p>Amal qilish muddati: 10 daqiqa.</p>`,
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
    await this.sendMail({
      to: opts.to,
      subject: `DENTA — ${opts.clinicName} klinikaga taklif`,
      text: [
        `Salom ${opts.inviteeName},`,
        ``,
        `Sizni ${opts.clinicName} klinikaga (${opts.role}) sifatida taklif qilishdi.`,
        `Taklifni qabul qilish: ${opts.acceptUrl}`,
        `Amal qilish muddati: ${expires}`,
      ].join('\n'),
      html: `
        <p>Salom <strong>${opts.inviteeName}</strong>,</p>
        <p>Sizni <strong>${opts.clinicName}</strong> klinikaga (<em>${opts.role}</em>) sifatida taklif qilishdi.</p>
        <p><a href="${opts.acceptUrl}">Taklifni qabul qilish</a></p>
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
