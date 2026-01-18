<div align="center">

# OpenMDM

**Open-Source Mobile Device Management**

Manage, secure, and monitor your mobile device fleet with a modern, enterprise-grade MDM solution.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

[Features](#features) • [Quick Start](#quick-start) • [Architecture](#architecture) • [Documentation](#documentation)

</div>

---

## Overview

OpenMDM is a full-featured Mobile Device Management platform built with modern technologies. It provides organizations with the tools they need to manage, secure, and monitor their mobile device fleet from a single, intuitive dashboard.

### Why OpenMDM?

- **Open Source** - Full transparency and community-driven development
- **Modern Stack** - Built with Next.js 16, React 19, and TypeScript
- **Beautiful UI** - Powered by shadcn/ui with a distinctive Electric Blue theme
- **Enterprise Ready** - Scalable architecture with PostgreSQL, Redis, and MQTT
- **Developer Friendly** - Type-safe APIs with oRPC, monorepo with Turborepo

---

## Features

### Device Management
- **Real-time Monitoring** - Track device status, battery, storage, and location
- **Remote Commands** - Lock, wipe, reboot devices remotely
- **Bulk Operations** - Execute commands across multiple devices at once

### Security Policies
- **Policy Templates** - Pre-built templates for common use cases (Kiosk, Restricted, Secure)
- **Granular Controls** - Configure camera, USB, WiFi, Bluetooth, and more
- **Password Enforcement** - Set minimum requirements and expiration rules

### Application Management
- **App Distribution** - Deploy applications to devices and groups
- **Version Control** - Track and manage app versions
- **Installation Policies** - Control which apps can be installed

### Device Groups
- **Hierarchical Organization** - Create nested groups for departments or locations
- **Targeted Deployment** - Apply policies and apps to specific groups
- **Bulk Assignment** - Quickly organize devices into groups

### Kiosk Mode
- **Single App Mode** - Lock devices to a specific application
- **Allowed Apps** - Define a whitelist of permitted applications
- **Exit Protection** - Secure kiosk mode with admin credentials

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 16, React 19, TypeScript |
| **Styling** | Tailwind CSS 4, shadcn/ui |
| **Backend** | Hono, oRPC (type-safe APIs) |
| **Database** | PostgreSQL 16, Drizzle ORM |
| **Auth** | Better-Auth |
| **Messaging** | MQTT (Eclipse Mosquitto) |
| **Storage** | MinIO (S3-compatible) |
| **Cache** | Redis |
| **Runtime** | Bun |
| **Build** | Turborepo |

---

## Quick Start

### Prerequisites

- [Bun](https://bun.sh/) (v1.2+)
- [Docker](https://www.docker.com/) & Docker Compose
- Git

### 1. Clone the Repository

```bash
git clone git@github.com:azoila/openmdm-demo.git
cd openmdm-demo
```

### 2. Start Infrastructure

```bash
docker compose up -d
```

This starts:
- **PostgreSQL** (port 5432) - Main database
- **MQTT Broker** (port 1883, 9001) - Device communication
- **MinIO** (port 9000, 9002) - APK storage
- **Redis** (port 6379) - Caching

### 3. Install Dependencies

```bash
bun install
```

### 4. Configure Environment

```bash
# Copy example env files
cp apps/server/.env.example apps/server/.env
```

Default database connection (works with Docker Compose):
```env
DATABASE_URL=postgresql://openmdm:openmdm123@localhost:5432/openmdm
```

### 5. Setup Database

```bash
bun run db:push
```

### 6. Start Development

```bash
bun run dev
```

Open your browser:
- **Web App**: http://localhost:3001
- **API Server**: http://localhost:3000

---

## Architecture

```
openmdm-demo/
├── apps/
│   ├── web/                 # Next.js 16 frontend
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── (public)/      # Landing page
│   │   │   │   ├── (auth)/        # Login, Register
│   │   │   │   └── (dashboard)/   # Protected dashboard
│   │   │   ├── components/
│   │   │   │   ├── mdm/           # MDM-specific components
│   │   │   │   ├── sidebar/       # Navigation sidebar
│   │   │   │   └── ui/            # shadcn/ui components
│   │   │   └── lib/               # Utilities, hooks, types
│   │   └── ...
│   │
│   └── server/              # Hono API server
│       ├── src/
│       │   ├── index.ts           # Server entry point
│       │   └── mdm.ts             # MDM API routes
│       └── ...
│
├── packages/
│   ├── api/                 # Shared API definitions (oRPC)
│   ├── auth/                # Authentication configuration
│   ├── db/                  # Database schema (Drizzle)
│   │   └── src/schema/
│   │       ├── index.ts           # Schema exports
│   │       └── mdm.ts             # MDM tables
│   ├── env/                 # Environment variable validation
│   └── config/              # Shared configurations
│
├── docker/                  # Docker configurations
│   └── mosquitto/           # MQTT broker config
│
├── docker-compose.yml       # Local infrastructure
└── turbo.json              # Turborepo configuration
```

### Route Structure

| Route | Description |
|-------|-------------|
| `/` | Landing page with features and pricing |
| `/login` | User authentication |
| `/register` | New account registration |
| `/dashboard` | Main dashboard overview |
| `/dashboard/devices` | Device management |
| `/dashboard/apps` | Application management |
| `/dashboard/groups` | Group management |
| `/dashboard/policies` | Policy configuration |

---

## Available Scripts

```bash
# Development
bun run dev              # Start all apps in development mode
bun run dev:web          # Start only the web app
bun run dev:server       # Start only the API server

# Build
bun run build            # Build all applications
bun run check-types      # TypeScript type checking

# Database
bun run db:push          # Push schema changes to database
bun run db:generate      # Generate migration files
bun run db:migrate       # Run migrations
bun run db:studio        # Open Drizzle Studio (database UI)
```

---

## Environment Variables

### Server (`apps/server/.env`)

```env
# Database
DATABASE_URL=postgresql://openmdm:openmdm123@localhost:5432/openmdm

# Authentication
BETTER_AUTH_SECRET=your-secret-key-here
BETTER_AUTH_URL=http://localhost:3000

# MQTT (optional)
MQTT_BROKER_URL=mqtt://localhost:1883

# MinIO (optional)
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=openmdm
MINIO_SECRET_KEY=openmdm123
```

---

## Design System

OpenMDM uses a distinctive **Electric Blue** (`#0EA5E9`) accent color with a modern, rounded design language.

### Key Visual Elements

- **Glassmorphism** - Subtle blur effects on headers and overlays
- **Rounded Corners** - `rounded-xl` (16px) and `rounded-2xl` (24px)
- **Glow Effects** - Primary color glow on interactive elements
- **Dark Mode** - Full support with deep slate backgrounds

### Color Palette

| Token | Light Mode | Dark Mode |
|-------|------------|-----------|
| Primary | `#0EA5E9` | `#0EA5E9` |
| Background | `#FAFBFC` | `#0F172A` |
| Card | `#FFFFFF` | `#1E293B` |
| Muted | `#F1F5F9` | `#334155` |

---

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with love using the Better-T-Stack**

[Report Bug](https://github.com/azoila/openmdm-demo/issues) • [Request Feature](https://github.com/azoila/openmdm-demo/issues)

</div>
