# Production Dockerfile for Clinic CRM (Next.js monorepo)
# Build context: repository root
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/clinic-web/package.json apps/clinic-web/
COPY packages/types/package.json packages/types/
COPY packages/mocks/package.json packages/mocks/
COPY packages/utils/package.json packages/utils/
COPY packages/design-tokens/package.json packages/design-tokens/
# Root workspace also lists Expo apps — package.json stubs keep npm workspaces happy
COPY apps/api/package.json apps/api/
COPY apps/client-app/package.json apps/client-app/
COPY apps/doctor-app/package.json apps/doctor-app/
RUN npm ci --ignore-scripts || npm install --ignore-scripts

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY apps/clinic-web ./apps/clinic-web
# npm nests clinic-web's own @types/react(-dom) and typescript here (root versions belong to Expo)
COPY --from=deps /app/apps/clinic-web/node_modules ./apps/clinic-web/node_modules
COPY packages ./packages
COPY locales ./locales
COPY apps/api/package.json apps/api/
COPY apps/client-app/package.json apps/client-app/
COPY apps/doctor-app/package.json apps/doctor-app/
ARG NEXT_PUBLIC_API_URL=https://oradent.uz/api/v1
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
# Legal values are inlined at build time; compose passes the API's LEGAL_* values.
ARG NEXT_PUBLIC_LEGAL_TERMS_VERSION=
ARG NEXT_PUBLIC_LEGAL_PRIVACY_VERSION=
ARG NEXT_PUBLIC_LEGAL_EFFECTIVE_DATE=
ARG NEXT_PUBLIC_LEGAL_UPDATED_DATE=
ARG NEXT_PUBLIC_LEGAL_OPERATOR_NAME=
ARG NEXT_PUBLIC_LEGAL_SUPPORT_EMAIL=
ARG NEXT_PUBLIC_LEGAL_PRIVACY_EMAIL=
ARG NEXT_PUBLIC_LEGAL_SUPPORT_PHONE=
ENV NEXT_PUBLIC_LEGAL_TERMS_VERSION=$NEXT_PUBLIC_LEGAL_TERMS_VERSION \
    NEXT_PUBLIC_LEGAL_PRIVACY_VERSION=$NEXT_PUBLIC_LEGAL_PRIVACY_VERSION \
    NEXT_PUBLIC_LEGAL_EFFECTIVE_DATE=$NEXT_PUBLIC_LEGAL_EFFECTIVE_DATE \
    NEXT_PUBLIC_LEGAL_UPDATED_DATE=$NEXT_PUBLIC_LEGAL_UPDATED_DATE \
    NEXT_PUBLIC_LEGAL_OPERATOR_NAME=$NEXT_PUBLIC_LEGAL_OPERATOR_NAME \
    NEXT_PUBLIC_LEGAL_SUPPORT_EMAIL=$NEXT_PUBLIC_LEGAL_SUPPORT_EMAIL \
    NEXT_PUBLIC_LEGAL_PRIVACY_EMAIL=$NEXT_PUBLIC_LEGAL_PRIVACY_EMAIL \
    NEXT_PUBLIC_LEGAL_SUPPORT_PHONE=$NEXT_PUBLIC_LEGAL_SUPPORT_PHONE
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build -w @denta/clinic-web

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
RUN apk add --no-cache curl
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs
COPY --from=build /app/apps/clinic-web/public ./apps/clinic-web/public
COPY --from=build --chown=nextjs:nodejs /app/apps/clinic-web/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/apps/clinic-web/.next/static ./apps/clinic-web/.next/static
USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -fsS http://127.0.0.1:3000/ || exit 1
CMD ["node", "apps/clinic-web/server.js"]
