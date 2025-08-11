# SaaS-Chat (MVP)

Monorepo com frontend (Next.js) e backend (NestJS + Prisma).  
Objetivo: chat web para atendimento ao cliente e suporte interno, pronto para futuras integrações ERP.

## Como rodar local
1. `docker compose up -d` (Postgres, Redis, MinIO)
2. `pnpm install`
3. `pnpm dev` (roda backend + frontend)

## Branch strategy
- `main` = produção
- `dev` = integração de features
- `feature/*` = novas funcionalidades
- `hotfix/*` = correções críticas
