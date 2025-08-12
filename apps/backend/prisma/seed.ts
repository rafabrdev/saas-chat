import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Verificar se já existe uma empresa demo
  let demoCompany = await prisma.company.findFirst({
    where: { name: 'BR Sistemas - Demo' },
  });

  if (!demoCompany) {
    // Criar empresa demo
    demoCompany = await prisma.company.create({
      data: {
        name: 'BR Sistemas - Demo',
        plan: 'ESSENTIAL',
      },
    });
    console.log('✅ Empresa demo criada:', demoCompany.name);
  } else {
    console.log('ℹ️ Empresa demo já existe:', demoCompany.name);
  }

  // Verificar se existe um usuário admin
  const adminUser = await prisma.user.findFirst({
    where: { 
      email: 'admin@demo.com',
      companyId: demoCompany.id,
    },
  });

  if (!adminUser) {
    // Criar usuário admin de demonstração
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('demo123', 10);

    const newAdminUser = await prisma.user.create({
      data: {
        name: 'Admin Demo',
        email: 'admin@demo.com',
        password: hashedPassword,
        role: 'admin',
        companyId: demoCompany.id,
        active: true,
      },
    });
    console.log('✅ Usuário admin criado:', newAdminUser.email);
    console.log('   Senha: demo123');
  } else {
    console.log('ℹ️ Usuário admin já existe:', adminUser.email);
  }

  console.log('\n🎉 Seed concluído com sucesso!');
  console.log('Você pode fazer login com:');
  console.log('Email: admin@demo.com');
  console.log('Senha: demo123');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
