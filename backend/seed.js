const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Đang khởi tạo dữ liệu hệ thống ---');

  // Super Admin
  await prisma.club.upsert({
    where: { username: 'admin_supper' },
    update: {},
    create: {
      name: 'Hệ thống Quản trị Tối cao',
      username: 'admin_supper',
      password: 'M@i250563533',
      role: 'superadmin',
      status: 'active'
    },
  });

  // Demo Club
  await prisma.club.upsert({
    where: { username: 'admin_sg' },
    update: {},
    create: {
      name: 'CLB Bóng Bàn 3T',
      username: 'admin_sg',
      password: 'admin',
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