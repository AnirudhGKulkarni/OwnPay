# PayFlow - Test Payment Gateway

## Overview

PayFlow is a test payment gateway demo application that simulates payment processing workflows. It allows users to create fake bank accounts and process mock transactions through a Razorpay-inspired interface. The application provides a complete payment flow including checkout forms, payment modals with multiple payment methods (card, UPI, netbanking), and receipt generation.

This is a full-stack TypeScript application built for educational and testing purposes, demonstrating payment gateway integration patterns without processing real payments.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- React with TypeScript using Vite as the build tool
- Client-side routing via `wouter` (lightweight React Router alternative)
- Type-safe development with strict TypeScript configuration

**UI Component System**
- shadcn/ui component library (Radix UI primitives) following the "new-york" style
- Tailwind CSS for styling with custom design tokens
- Custom color system supporting light/dark themes via CSS variables
- Design inspired by Razorpay's clean, trust-focused payment interface

**State Management**
- TanStack Query (React Query) for server state management and data fetching
- React Hook Form with Zod validation for form state
- Local component state using React hooks

**Key Pages & Routes**
- `/` - Checkout page for creating orders
- `/accounts` - Bank account management interface
- `/receipt/:id` - Transaction receipt display
- 404 fallback for unmatched routes

### Backend Architecture

**Server Framework**
- Express.js with TypeScript
- HTTP server setup for both development (Vite middleware) and production (static file serving)
- RESTful API design pattern

**API Endpoints**
- `POST /api/create-account` - Create test bank account
- `GET /api/accounts` - Fetch all bank accounts
- `POST /api/create-order` - Create payment order
- `POST /api/process-payment` - Process payment transaction
- `GET /api/transactions/:id` - Retrieve transaction details

**Data Validation**
- Zod schemas for runtime type validation shared between client and server
- Input validation middleware on all API endpoints
- Type-safe request/response handling

### Data Storage

**Current Implementation**
- In-memory storage using Map data structures (`MemStorage` class)
- Pre-seeded with sample bank accounts (HDFC, ICICI, SBI)
- No persistence - data resets on server restart

**Database Configuration**
- Drizzle ORM configured for PostgreSQL (via `drizzle.config.ts`)
- Schema definitions in `shared/schema.ts` using Zod
- Migration system ready (`migrations/` directory)
- **Note**: Database integration is configured but storage layer uses in-memory implementation. Can be easily migrated to PostgreSQL by implementing the `IStorage` interface with Drizzle queries.

**Data Models**
- `BankAccount` - Test bank account with balance tracking
- `Order` - Customer order with contact details and amount
- `Transaction` - Payment transaction with status and method details

### Build & Deployment

**Development Mode**
- Vite dev server with HMR (Hot Module Replacement)
- Express server with middleware mode Vite integration
- Automatic TypeScript compilation and hot reload

**Production Build**
- Client: Vite builds to `dist/public/`
- Server: esbuild bundles to `dist/index.cjs` with selective dependency bundling
- Optimized bundle with allowlisted dependencies for faster cold starts
- Static file serving from built client assets

**Build Optimization Strategy**
- Server dependencies are selectively bundled vs externalized
- Allowlist includes core dependencies (drizzle-orm, express, pg, etc.)
- Reduces filesystem syscalls for improved cold start performance

### Design System

**Typography**
- Primary font: Inter/SF Pro Display (Google Fonts)
- Monospace: JetBrains Mono (deprecated), Fira Code, Geist Mono for numerical data
- Hierarchical scale from xs to 2xl with semantic weights

**Component Layout**
- Centered card-based layouts with max-width constraints
- Consistent spacing using Tailwind's spacing scale (2, 4, 6, 8 units)
- Modal overlays with backdrop blur effects
- Responsive design with mobile-first breakpoints

**Color & Theme System**
- CSS custom properties for theme colors
- Dual theme support (light/dark) via class-based switching
- Neutral base color with primary blue accent (HSL 217 91% 35%)
- Elevation system using subtle shadows and opacity overlays

## External Dependencies

### UI Framework & Components
- **@radix-ui/*** - Headless UI primitives for accessible components (dialogs, dropdowns, forms, etc.)
- **shadcn/ui** - Pre-built component implementations via components.json configuration
- **lucide-react** - Icon library
- **tailwindcss** - Utility-first CSS framework
- **class-variance-authority** - Variant-based component styling
- **embla-carousel-react** - Carousel/slider functionality

### Form Management
- **react-hook-form** - Form state management and validation
- **@hookform/resolvers** - Validation resolver integration
- **zod** - Schema validation library
- **drizzle-zod** - Zod schema generation from Drizzle schemas

### Data Fetching & State
- **@tanstack/react-query** - Server state management and caching
- **wouter** - Lightweight client-side routing

### Backend Dependencies
- **express** - Web server framework
- **drizzle-orm** - TypeScript ORM for SQL databases
- **drizzle-kit** - Database migration toolkit
- **pg** - PostgreSQL client (configured but not actively used)
- **connect-pg-simple** - PostgreSQL session store for Express (available for future use)

### Development Tools
- **vite** - Frontend build tool and dev server
- **@vitejs/plugin-react** - React support for Vite
- **esbuild** - Fast JavaScript bundler for server code
- **tsx** - TypeScript execution for Node.js
- **typescript** - Type system and compiler

### Utility Libraries
- **date-fns** - Date manipulation and formatting
- **nanoid** - Unique ID generation
- **clsx** / **tailwind-merge** - Conditional className utilities

### Replit-Specific Integrations
- **@replit/vite-plugin-runtime-error-modal** - Error overlay in development
- **@replit/vite-plugin-cartographer** - Development tooling (dev only)
- **@replit/vite-plugin-dev-banner** - Development banner (dev only)