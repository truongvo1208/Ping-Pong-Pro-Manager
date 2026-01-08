
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Đang khởi tạo dữ liệu hệ thống ---');

  // Super Admin
  await prisma.club.upsert({
    where: { username: 'sadmin' },
    update: {},
    create: {
      name: 'Hệ thống Quản trị Tối cao',
      username: 'sadmin',
      password: 'M@i250563533',
      role: 'superadmin',
      status: 'active'
    },
  });

  // Demo Club
  await prisma.club.upsert({
    where: { username: 'demopro' },
    update: {},
    create: {
      name: 'CLB Bóng Bàn Demo Pro',
      username: 'demopro',
      password: 'demopro@123',
      role: 'club',
      status: 'active'
    },
  });

  console.log('Dữ liệu mẫu đã được nạp thành công.');
}

main()
  .catch((e) => {
    console.error('Lỗi Seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
