#!/bin/bash

# Script de setup para ambiente de desenvolvimento
# Uso: ./scripts/setup-dev.sh

set -e

echo "🚀 Configurando ambiente de desenvolvimento para SaaS Chat..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Verificar se o Node.js está instalado
if ! command -v node &> /dev/null; then
    print_error "Node.js não encontrado. Instale o Node.js 18+ primeiro."
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js versão 18+ é necessária. Versão atual: $(node --version)"
    exit 1
fi

print_status "Node.js $(node --version) encontrado"

# Verificar se o pnpm está instalado
if ! command -v pnpm &> /dev/null; then
    print_warning "pnpm não encontrado. Instalando..."
    npm install -g pnpm
fi

print_status "pnpm $(pnpm --version) encontrado"

# Verificar se o Docker está instalado
if ! command -v docker &> /dev/null; then
    print_error "Docker não encontrado. Instale o Docker primeiro."
    exit 1
fi

# Verificar se o Docker Compose está instalado
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    print_error "Docker Compose não encontrado. Instale o Docker Compose primeiro."
    exit 1
fi

print_status "Docker encontrado"

# Instalar dependências
print_info "Instalando dependências..."
pnpm install

print_status "Dependências instaladas"

# Configurar arquivos .env
print_info "Configurando arquivos de ambiente..."

if [ ! -f "apps/backend/.env" ]; then
    cp apps/backend/.env.example apps/backend/.env
    print_status "Arquivo apps/backend/.env criado"
else
    print_warning "apps/backend/.env já existe"
fi

if [ ! -f "apps/frontend/.env" ]; then
    cp apps/frontend/.env.example apps/frontend/.env
    print_status "Arquivo apps/frontend/.env criado"
else
    print_warning "apps/frontend/.env já existe"
fi

# Iniciar serviços Docker
print_info "Iniciando serviços Docker (PostgreSQL, Redis, MinIO)..."
docker-compose up -d

# Aguardar os serviços ficarem prontos
print_info "Aguardando serviços ficarem prontos..."
sleep 10

# Verificar se o PostgreSQL está rodando
until docker-compose exec -T db pg_isready -U postgres > /dev/null 2>&1; do
    print_info "Aguardando PostgreSQL..."
    sleep 2
done

print_status "PostgreSQL está rodando"

# Verificar se o Redis está rodando
until docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; do
    print_info "Aguardando Redis..."
    sleep 2
done

print_status "Redis está rodando"

# Gerar cliente Prisma
print_info "Gerando cliente Prisma..."
cd apps/backend && pnpm prisma generate
print_status "Cliente Prisma gerado"

# Executar migrations
print_info "Executando migrations do banco de dados..."
pnpm prisma migrate dev
print_status "Migrations executadas"

# Voltar para o diretório raiz
cd ../..

# Executar testes para verificar se tudo está funcionando
print_info "Executando testes básicos..."
pnpm test:backend --passWithNoTests --silent
pnpm test:frontend --run --reporter=basic

print_status "Testes básicos passaram"

echo ""
echo "🎉 Setup concluído com sucesso!"
echo ""
echo "Para iniciar o desenvolvimento:"
echo "  ${BLUE}pnpm dev${NC}        # Inicia backend e frontend"
echo "  ${BLUE}pnpm dev:backend${NC} # Apenas backend"
echo "  ${BLUE}pnpm dev:frontend${NC} # Apenas frontend"
echo ""
echo "URLs disponíveis:"
echo "  Frontend: ${BLUE}http://localhost:5173${NC}"
echo "  Backend:  ${BLUE}http://localhost:3001${NC}"
echo "  Prisma Studio: ${BLUE}pnpm -w db:studio${NC}"
echo ""
echo "Serviços Docker:"
echo "  PostgreSQL: ${BLUE}localhost:5432${NC}"
echo "  Redis:      ${BLUE}localhost:6379${NC}"
echo "  MinIO:      ${BLUE}http://localhost:9000${NC}"
echo ""
print_warning "Certifique-se de que as portas 3001, 5173, 5432, 6379 e 9000 estão disponíveis."