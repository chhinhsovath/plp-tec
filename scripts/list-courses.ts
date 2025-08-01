import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const courses = await prisma.course.findMany({
    select: {
      id: true,
      code: true,
      title: true,
      isActive: true,
      _count: {
        select: {
          enrollments: true,
          modules: true
        }
      }
    }
  })

  console.log('Available Courses:')
  console.log('==================')
  courses.forEach(course => {
    console.log(`\nCourse: ${course.code} - ${course.title}`)
    console.log(`ID: ${course.id}`)
    console.log(`Active: ${course.isActive}`)
    console.log(`Modules: ${course._count.modules}, Enrollments: ${course._count.enrollments}`)
    console.log(`URL: https://tec.openplp.com/courses/${course.id}`)
  })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })