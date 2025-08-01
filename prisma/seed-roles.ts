import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Define comprehensive roles for nationwide LMS
const systemRoles = [
  // Ministry Level Roles
  {
    name: 'super_admin',
    displayName: 'Super Administrator',
    description: 'Full system access across all institutions',
    level: 1,
    isSystem: true,
  },
  {
    name: 'ministry_admin',
    displayName: 'Ministry Administrator',
    description: 'Ministry of Education administrator with oversight capabilities',
    level: 2,
    isSystem: true,
  },
  {
    name: 'ministry_coordinator',
    displayName: 'Ministry Coordinator',
    description: 'Coordinates educational programs at ministry level',
    level: 3,
    isSystem: true,
  },
  {
    name: 'ministry_analyst',
    displayName: 'Ministry Data Analyst',
    description: 'Access to analytics and reporting across institutions',
    level: 3,
    isSystem: true,
  },

  // Regional/District Level Roles
  {
    name: 'regional_director',
    displayName: 'Regional Education Director',
    description: 'Manages educational institutions in a region',
    level: 4,
    isSystem: true,
  },
  {
    name: 'district_supervisor',
    displayName: 'District Education Supervisor',
    description: 'Supervises educational quality at district level',
    level: 5,
    isSystem: true,
  },

  // Institution Level Roles
  {
    name: 'institution_admin',
    displayName: 'Institution Administrator',
    description: 'Full administrative access within an institution',
    level: 6,
    isSystem: true,
  },
  {
    name: 'principal',
    displayName: 'Principal/Dean',
    description: 'Head of teacher education institution',
    level: 7,
    isSystem: true,
  },
  {
    name: 'academic_director',
    displayName: 'Academic Director',
    description: 'Manages academic programs and curriculum',
    level: 8,
    isSystem: true,
  },
  {
    name: 'registrar',
    displayName: 'Registrar',
    description: 'Manages student records and enrollment',
    level: 9,
    isSystem: true,
  },
  {
    name: 'quality_assurance',
    displayName: 'Quality Assurance Officer',
    description: 'Monitors and ensures educational quality standards',
    level: 9,
    isSystem: true,
  },

  // Department Level Roles
  {
    name: 'department_head',
    displayName: 'Department Head',
    description: 'Leads an academic department',
    level: 10,
    isSystem: true,
  },
  {
    name: 'program_coordinator',
    displayName: 'Program Coordinator',
    description: 'Coordinates specific educational programs',
    level: 11,
    isSystem: true,
  },

  // Teaching Roles
  {
    name: 'senior_instructor',
    displayName: 'Senior Instructor',
    description: 'Experienced teacher educator with mentoring responsibilities',
    level: 12,
    isSystem: true,
  },
  {
    name: 'instructor',
    displayName: 'Instructor',
    description: 'Teacher educator responsible for courses',
    level: 13,
    isSystem: true,
  },
  {
    name: 'assistant_instructor',
    displayName: 'Assistant Instructor',
    description: 'Supporting instructor for courses and practicals',
    level: 14,
    isSystem: true,
  },
  {
    name: 'practicum_supervisor',
    displayName: 'Practicum Supervisor',
    description: 'Supervises student teachers during practice teaching',
    level: 14,
    isSystem: true,
  },
  {
    name: 'mentor_teacher',
    displayName: 'Mentor Teacher',
    description: 'Experienced teacher who mentors student teachers',
    level: 15,
    isSystem: true,
  },

  // Student Roles
  {
    name: 'student_teacher',
    displayName: 'Student Teacher',
    description: 'Pre-service teacher in training',
    level: 20,
    isSystem: true,
  },
  {
    name: 'in_service_teacher',
    displayName: 'In-Service Teacher',
    description: 'Practicing teacher enrolled in professional development',
    level: 20,
    isSystem: true,
  },
  {
    name: 'alumni',
    displayName: 'Alumni',
    description: 'Graduated teacher with limited access',
    level: 21,
    isSystem: true,
  },

  // Support Roles
  {
    name: 'librarian',
    displayName: 'Librarian',
    description: 'Manages educational resources and e-library',
    level: 16,
    isSystem: true,
  },
  {
    name: 'it_support',
    displayName: 'IT Support',
    description: 'Technical support for the LMS',
    level: 16,
    isSystem: true,
  },
  {
    name: 'counselor',
    displayName: 'Student Counselor',
    description: 'Provides guidance and support to student teachers',
    level: 16,
    isSystem: true,
  },
  {
    name: 'content_developer',
    displayName: 'Content Developer',
    description: 'Creates and manages educational content',
    level: 17,
    isSystem: true,
  },

  // External Roles
  {
    name: 'external_examiner',
    displayName: 'External Examiner',
    description: 'External quality assurance and examination',
    level: 18,
    isSystem: true,
  },
  {
    name: 'guest_lecturer',
    displayName: 'Guest Lecturer',
    description: 'External expert providing specialized lectures',
    level: 19,
    isSystem: true,
  },
  {
    name: 'observer',
    displayName: 'Observer',
    description: 'Limited read-only access for monitoring',
    level: 25,
    isSystem: true,
  },
];

// Define permissions
const permissions = [
  // User Management
  { resource: 'user', action: 'create', description: 'Create new users' },
  { resource: 'user', action: 'read', description: 'View user information' },
  { resource: 'user', action: 'update', description: 'Update user information' },
  { resource: 'user', action: 'delete', description: 'Delete users' },
  { resource: 'user', action: 'manage_roles', description: 'Assign/remove user roles' },

  // Course Management
  { resource: 'course', action: 'create', description: 'Create new courses' },
  { resource: 'course', action: 'read', description: 'View course content' },
  { resource: 'course', action: 'update', description: 'Update course content' },
  { resource: 'course', action: 'delete', description: 'Delete courses' },
  { resource: 'course', action: 'publish', description: 'Publish/unpublish courses' },
  { resource: 'course', action: 'enroll', description: 'Enroll in courses' },
  { resource: 'course', action: 'manage_enrollment', description: 'Manage course enrollments' },

  // Assessment Management
  { resource: 'assessment', action: 'create', description: 'Create assessments' },
  { resource: 'assessment', action: 'read', description: 'View assessments' },
  { resource: 'assessment', action: 'update', description: 'Update assessments' },
  { resource: 'assessment', action: 'delete', description: 'Delete assessments' },
  { resource: 'assessment', action: 'attempt', description: 'Take assessments' },
  { resource: 'assessment', action: 'grade', description: 'Grade assessments' },
  { resource: 'assessment', action: 'view_all_results', description: 'View all assessment results' },

  // Assignment Management
  { resource: 'assignment', action: 'create', description: 'Create assignments' },
  { resource: 'assignment', action: 'read', description: 'View assignments' },
  { resource: 'assignment', action: 'update', description: 'Update assignments' },
  { resource: 'assignment', action: 'delete', description: 'Delete assignments' },
  { resource: 'assignment', action: 'submit', description: 'Submit assignments' },
  { resource: 'assignment', action: 'grade', description: 'Grade assignments' },

  // Resource Management
  { resource: 'resource', action: 'create', description: 'Upload resources' },
  { resource: 'resource', action: 'read', description: 'View resources' },
  { resource: 'resource', action: 'update', description: 'Update resources' },
  { resource: 'resource', action: 'delete', description: 'Delete resources' },
  { resource: 'resource', action: 'manage_library', description: 'Manage e-library' },

  // Analytics & Reports
  { resource: 'analytics', action: 'view_own', description: 'View own analytics' },
  { resource: 'analytics', action: 'view_course', description: 'View course analytics' },
  { resource: 'analytics', action: 'view_institution', description: 'View institution analytics' },
  { resource: 'analytics', action: 'view_system', description: 'View system-wide analytics' },
  { resource: 'analytics', action: 'export', description: 'Export analytics data' },

  // Communication
  { resource: 'message', action: 'send', description: 'Send messages' },
  { resource: 'message', action: 'broadcast', description: 'Send broadcast messages' },
  { resource: 'announcement', action: 'create', description: 'Create announcements' },
  { resource: 'announcement', action: 'update', description: 'Update announcements' },
  { resource: 'announcement', action: 'delete', description: 'Delete announcements' },

  // Chat/AI Assistant
  { resource: 'chat', action: 'access', description: 'Access AI chat assistant' },
  { resource: 'chat', action: 'view_history', description: 'View chat history' },
  { resource: 'chat', action: 'moderate', description: 'Moderate chat interactions' },

  // Institution Management
  { resource: 'institution', action: 'create', description: 'Create institutions' },
  { resource: 'institution', action: 'read', description: 'View institution details' },
  { resource: 'institution', action: 'update', description: 'Update institution details' },
  { resource: 'institution', action: 'delete', description: 'Delete institutions' },
  { resource: 'institution', action: 'manage', description: 'Manage institution settings' },

  // System Administration
  { resource: 'system', action: 'manage_settings', description: 'Manage system settings' },
  { resource: 'system', action: 'view_logs', description: 'View system logs' },
  { resource: 'system', action: 'backup', description: 'Perform system backups' },
  { resource: 'system', action: 'maintain', description: 'Perform system maintenance' },
];

// Define role-permission mappings
const rolePermissionMappings = {
  super_admin: ['*'], // All permissions
  
  ministry_admin: [
    'user:*', 'course:*', 'institution:*', 'analytics:*', 'system:manage_settings'
  ],
  
  ministry_coordinator: [
    'user:read', 'course:read', 'institution:read', 'analytics:view_system', 'analytics:export'
  ],
  
  ministry_analyst: [
    'analytics:*', 'user:read', 'course:read', 'institution:read'
  ],
  
  regional_director: [
    'institution:read', 'institution:update', 'analytics:view_institution', 
    'user:read', 'course:read'
  ],
  
  institution_admin: [
    'user:create', 'user:read', 'user:update', 'user:manage_roles',
    'course:*', 'assessment:*', 'assignment:*', 'resource:*',
    'analytics:view_institution', 'announcement:*', 'institution:manage'
  ],
  
  principal: [
    'user:read', 'course:read', 'course:publish', 
    'analytics:view_institution', 'announcement:*', 'institution:manage'
  ],
  
  academic_director: [
    'course:*', 'assessment:*', 'assignment:*', 'resource:*',
    'analytics:view_course', 'user:read'
  ],
  
  registrar: [
    'user:create', 'user:read', 'user:update', 'course:manage_enrollment',
    'analytics:view_institution'
  ],
  
  instructor: [
    'course:create', 'course:read', 'course:update', 'course:publish',
    'assessment:*', 'assignment:*', 'resource:create', 'resource:read', 'resource:update',
    'analytics:view_course', 'message:send', 'announcement:create', 'chat:access'
  ],
  
  student_teacher: [
    'course:read', 'course:enroll', 'assessment:attempt', 'assignment:submit',
    'resource:read', 'analytics:view_own', 'message:send', 'chat:access'
  ],
  
  librarian: [
    'resource:*', 'analytics:view_course'
  ],
  
  it_support: [
    'user:read', 'system:view_logs', 'chat:moderate'
  ],
};

async function seedRoles() {
  console.log('Seeding roles and permissions...');

  try {
    // Create permissions
    for (const permission of permissions) {
      await prisma.permission.upsert({
        where: {
          resource_action: {
            resource: permission.resource,
            action: permission.action,
          },
        },
        update: {},
        create: permission,
      });
    }
    console.log(`Created ${permissions.length} permissions`);

    // Create roles
    for (const role of systemRoles) {
      await prisma.role.upsert({
        where: { name: role.name },
        update: {
          displayName: role.displayName,
          description: role.description,
          level: role.level,
        },
        create: role,
      });
    }
    console.log(`Created ${systemRoles.length} roles`);

    // Create role-permission relationships
    for (const [roleName, permissionPatterns] of Object.entries(rolePermissionMappings)) {
      const role = await prisma.role.findUnique({ where: { name: roleName } });
      if (!role) continue;

      // Get all permissions for this role
      const rolePermissions = [];
      for (const pattern of permissionPatterns) {
        if (pattern === '*') {
          // All permissions
          rolePermissions.push(...(await prisma.permission.findMany()));
        } else if (pattern.includes(':*')) {
          // All actions for a resource
          const resource = pattern.split(':')[0];
          const perms = await prisma.permission.findMany({
            where: { resource },
          });
          rolePermissions.push(...perms);
        } else {
          // Specific permission
          const [resource, action] = pattern.split(':');
          const perm = await prisma.permission.findFirst({
            where: { resource, action },
          });
          if (perm) rolePermissions.push(perm);
        }
      }

      // Create role-permission relationships
      for (const permission of rolePermissions) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId: permission.id,
            },
          },
          update: {},
          create: {
            roleId: role.id,
            permissionId: permission.id,
          },
        });
      }
    }

    console.log('Role-permission relationships created');
    console.log('Seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding roles:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedRoles().catch((e) => {
  console.error(e);
  process.exit(1);
});