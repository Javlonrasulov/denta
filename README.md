# DENTA.UZ

Uchta alohida product:

| Product | Stack | Path | Port |
|---------|--------|------|------|
| **Client App** | React Native + Expo | `apps/client-app` | **8081** |
| **Doctor App** | React Native + Expo | `apps/doctor-app` | **8082** |
| **Clinic CRM** | **Next.js** (web) | `apps/clinic-web` | **3000** |

> **Muhim:** Clinic CRM — Next.js. Doctor/Client Expo Web Clinic CRM emas.
> `expo start --web` orqali Clinic ochilmasin.

## Local development

```bash
# root
npm install

# Clinic CRM (browser)
cd apps/clinic-web
npm run dev
# → http://localhost:3000

# Client mobile
cd apps/client-app
npm run start
# → Metro :8081

# Doctor mobile
cd apps/doctor-app
npm run start
# → Metro :8082
```

Yoki rootdan:

```bash
npm run start:clinic   # Next.js :3000
npm run start:client   # Expo client :8081
npm run start:doctor   # Expo doctor :8082
```

## Architecture

```
apps/
  client-app/     # Expo entry (APP_VARIANT=client, port 8081)
  doctor-app/     # Expo entry (APP_VARIANT=doctor, port 8082)
  clinic-web/     # Next.js Clinic CRM (port 3000)
packages/
  types/          # shared domain types
  mocks/          # clinic web mock data
  utils/          # formatPrice, dates
  design-tokens/  # shared tokens
app/              # Expo Router screens (client + doctor + legacy clinic RN)
components/       # mobile UI (not used by clinic-web)
```

Mobile UI (`react-native`) Clinic Web’ga import qilinmaydi. Clinic Web — alohida DOM/Tailwind UI.

## Clinic CRM modules

Overview · Appointments · Patients · Doctors · Rooms · Services · Finance · Inventory · Reports · Settings

Layout: left sidebar + top header + main content (desktop/tablet first).
