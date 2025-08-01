import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function addAdminUser() {
  try {
    console.log('🔐 Creating admin user...');
    
    // Hash the password
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Create or update the admin user
    const admin = await prisma.user.upsert({
      where: { email: 'chhinhs@gmail.com' },
      update: {
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true,
      },
      create: {
        email: 'chhinhs@gmail.com',
        username: 'chhinhs',
        password: hashedPassword,
        firstName: 'Chhinh',
        lastName: 'Sovath',
        role: 'ADMIN',
        isActive: true,
        emailVerified: new Date(),
        profile: {
          create: {
            bio: 'System Administrator',
            phoneNumber: '+855 12 345 678'
          }
        }
      }
    });
    
    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: chhinhs@gmail.com');
    console.log('🔑 Password: admin123');
    console.log('👤 Role: ADMIN');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addAdminUser();