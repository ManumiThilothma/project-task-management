import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Helper to hash password
  const hashPassword = (password: string) => bcrypt.hashSync(password, 10);

  // 1. Create Users
  const admin = await prisma.user.upsert({
    where: { email: 'admin@taskflow.com' },
    update: {},
    create: {
      email: 'admin@taskflow.com',
      name: 'Sarah Jenkins (Admin)',
      passwordHash: hashPassword('admin123'),
      role: 'ADMIN',
    },
  });

  const pm = await prisma.user.upsert({
    where: { email: 'pm@taskflow.com' },
    update: {},
    create: {
      email: 'pm@taskflow.com',
      name: 'Marcus Brody (PM)',
      passwordHash: hashPassword('pm123'),
      role: 'PROJECT_MANAGER',
    },
  });

  const dev = await prisma.user.upsert({
    where: { email: 'dev@taskflow.com' },
    update: {},
    create: {
      email: 'dev@taskflow.com',
      name: 'Alex Rivera (Dev)',
      passwordHash: hashPassword('dev123'),
      role: 'TEAM_MEMBER',
    },
  });

  const qa = await prisma.user.upsert({
    where: { email: 'qa@taskflow.com' },
    update: {},
    create: {
      email: 'qa@taskflow.com',
      name: 'Elena Rostova (QA)',
      passwordHash: hashPassword('qa123'),
      role: 'TEAM_MEMBER',
    },
  });

  console.log('Users created:', {
    admin: admin.email,
    pm: pm.email,
    dev: dev.email,
    qa: qa.email,
  });

  // 2. Create Projects
  const project1 = await prisma.project.create({
    data: {
      name: 'Alpha Mobile App',
      description: 'Redesign the corporate mobile app using React Native and Node.js.',
      status: 'IN_PROGRESS',
      managerId: pm.id,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      members: {
        create: [
          { userId: dev.id, roleInProject: 'Lead Frontend Developer' },
          { userId: qa.id, roleInProject: 'Senior QA Engineer' },
        ],
      },
    },
  });

  const project2 = await prisma.project.create({
    data: {
      name: 'Beta Cloud Migration',
      description: 'Migrate on-premise microservices to AWS cloud cluster.',
      status: 'PLANNED',
      managerId: pm.id,
      startDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // starts in 15 days
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      members: {
        create: [
          { userId: dev.id, roleInProject: 'Cloud Infrastructure Architect' },
        ],
      },
    },
  });

  console.log('Projects created:', [project1.name, project2.name]);

  // 3. Create Tasks for Project 1
  const task1 = await prisma.task.create({
    data: {
      title: 'Design Mobile Wireframes',
      description: 'Create Figma design mockups for the home and checkout screens.',
      status: 'DONE',
      priority: 'HIGH',
      projectId: project1.id,
      assigneeId: dev.id,
      creatorId: pm.id,
      dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // due 2 days ago
      activityLogs: {
        create: [
          { userId: pm.id, actionType: 'CREATE', message: 'Task created' },
          { userId: dev.id, actionType: 'STATUS_CHANGE', message: 'Updated status to DONE' },
        ],
      },
    },
  });

  const task2 = await prisma.task.create({
    data: {
      title: 'Setup API Gateway Route',
      description: 'Configure routes and endpoints in Express for secure login.',
      status: 'IN_PROGRESS',
      priority: 'URGENT',
      projectId: project1.id,
      assigneeId: dev.id,
      creatorId: pm.id,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // due in 3 days
      activityLogs: {
        create: [
          { userId: pm.id, actionType: 'CREATE', message: 'Task created' },
          { userId: dev.id, actionType: 'STATUS_CHANGE', message: 'Started working on the API gateway config' },
        ],
      },
    },
  });

  const task3 = await prisma.task.create({
    data: {
      title: 'Write Integration Test Suite',
      description: 'Run integration test runner to verify database transaction speed and auth security.',
      status: 'TODO',
      priority: 'MEDIUM',
      projectId: project1.id,
      assigneeId: qa.id,
      creatorId: pm.id,
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // due in 10 days
      activityLogs: {
        create: [
          { userId: pm.id, actionType: 'CREATE', message: 'Task created' },
        ],
      },
    },
  });

  console.log('Tasks created successfully for project:', project1.name);
  console.log('Database seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
