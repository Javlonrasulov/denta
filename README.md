# Denta

Premium stomatologiya platformasi — **Client**, **Doctor** va **Clinic CRM** frontend (Expo / React Native).

Hozircha faqat frontend: mock data + local state. Backend (NestJS + Prisma + PostgreSQL) keyingi bosqichda ulanadi.

## Stack

- Expo 57 · React Native · TypeScript · Expo Router
- NativeWind · Reanimated · Gesture Handler · SVG
- Zustand · TanStack Query · i18next (uz / uz-Cyrl / ru / en)
- Plus Jakarta Sans · Lucide icons · SecureStore-ready auth storage

## Ishga tushirish

```bash
npm install
npx expo start
```

Rol tanlash ekranidan Client / Doctor / Clinic ilovasiga o‘ting.

## Arxitektura

```
app/(client)   — bemor ilovasi (tabs, klinika, shifokor, booking, map)
app/(doctor)   — shifokor (dashboard, calendar, patients + odontogram, finance)
app/(clinic)   — klinika CRM (dashboard, appointments, doctors, inventory)
components/    — UI + feature komponentlar
services/      — API abstraction (mock delay; NestJS uchun tayyor)
hooks/         — TanStack Query hooks
store/         — Zustand (settings, favorites, appointments draft)
theme/         — design tokens + ThemeProvider (light/dark)
locales/       — 4 til
mocks/         — realistik O‘zbekiston ma’lumotlari
```

## Booking slot logikasi

Shifokor ish vaqti `09:00–18:00`, tanaffus `13:00–14:00`, davomiylik `30 min`. Band qilingan slotlar o‘chirilgan — random emas. Keyin shu logika backendga ko‘chiriladi.

## Keyingi bosqich

NestJS + Prisma + PostgreSQL + Redis + Socket.IO + Firebase Notifications + Mapbox.
