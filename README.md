# anicite

Chrome analytics done right

## Quick Start

```bash
pnpm install
pnpm init:project
pnpm dev
```

## What's Running

- **Web:** http://localhost:3000
- **API:** http://localhost:8080
- **API Docs:** http://localhost:8080/docs

## Project Structure

```
anicite/
├── apps/
│   ├── web/          # Next.js frontend
│   └── api/          # Fastify backend
└── packages/
    ├── types/        # Shared Zod schemas
    ├── utils/        # Shared utilities
    └── ui/           # Shared UI components
```

## Database

```bash
pnpm db:studio        # Open Prisma Studio
pnpm db:migrate       # Run migrations
pnpm db:seed          # Seed database
```

---

Built with [Blitzpack](https://github.com/CarboxyDev/blitzpack)
