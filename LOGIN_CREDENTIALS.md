# Login Credentials for TEC LMS

## Admin Account (Your Account)
- **Email**: chhinhs@gmail.com
- **Password**: admin123
- **Role**: Administrator (Full Access)

## Other Test Accounts

### System Admin
- **Email**: admin@tec-lms.com
- **Password**: admin123
- **Role**: Administrator

### Instructors
- **Email**: instructor1@tec-lms.com
- **Password**: instructor123
- **Role**: Instructor (John Smith - Pedagogy)

- **Email**: instructor2@tec-lms.com
- **Password**: instructor123
- **Role**: Instructor (Sarah Johnson - ICT)

### Students
- **Email**: student1@tec-lms.com
- **Password**: student123
- **Role**: Student

- **Email**: student2@tec-lms.com
- **Password**: student123
- **Role**: Student

(Additional students: student3, student4, student5 with same password pattern)

## How to Create These Users

### Option 1: Run Database Seed (Creates All Users)
```bash
npm run db:seed
```

### Option 2: Create Only Your Admin User
```bash
npm run db:add-admin
```

### Option 3: Manual Database Setup
```bash
# Run migrations first
npm run db:migrate:deploy

# Then seed the database
npm run db:seed
```

## For Production Deployment

1. The database needs to be initialized first
2. Run migrations on production database
3. Run seed script or manually create admin user
4. Change passwords after first login for security

## Troubleshooting

If you can't login:
1. Check if database is connected (verify DATABASE_URL)
2. Run `npm run db:verify` to check database status
3. Run `npm run db:seed` to create users
4. Check browser console for errors