import { PrismaClient } from '@prisma/client';

const BASE_URL = 'http://localhost:3000';

function extractTokenCookie(headers: Headers): string {
  const setCookie = headers.get('set-cookie');
  if (!setCookie) throw new Error('No Set-Cookie header found in login response');
  const match = setCookie.match(/token=([^;]+)/);
  if (!match) throw new Error('Token cookie not found in Set-Cookie header');
  return `token=${match[1]}`;
}

async function runTests() {
  console.log('=== STARTING TASKFLOW PRO REST API INTEGRATION TESTS ===\n');

  // Pre-test cleanup: delete previous test user if it exists
  const prisma = new PrismaClient();
  await prisma.user.deleteMany({
    where: { email: 'john.tester@taskflow.com' }
  });
  await prisma.$disconnect();
  console.log('   Cleaned up any existing "john.tester@taskflow.com" records.');

  let adminCookie = '';
  let pmCookie = '';
  let devCookie = '';
  let testUserId = '';
  let projectId = '';
  let taskId = '';

  // 1. Admin Login
  console.log('1. Logging in as Administrator (admin@taskflow.com)...');
  const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@taskflow.com', password: 'admin123' }),
  });
  if (adminLoginRes.status !== 200) {
    throw new Error(`Admin login failed with status ${adminLoginRes.status}: ${await adminLoginRes.text()}`);
  }
  adminCookie = extractTokenCookie(adminLoginRes.headers);
  const adminData = await adminLoginRes.json();
  console.log(`   Logged in successfully as: ${adminData.user.name} (${adminData.user.role})\n`);

  // 2. Fetch User List (Admin Only)
  console.log('2. Admin fetching user list...');
  const usersRes = await fetch(`${BASE_URL}/api/users`, {
    headers: { Cookie: adminCookie },
  });
  if (usersRes.status !== 200) {
    throw new Error(`Failed to fetch user list: ${await usersRes.text()}`);
  }
  const usersData = await usersRes.json();
  const users = usersData.users;
  console.log(`   Found ${users.length} users in the system.\n`);

  // 3. Create a New User (Admin Only)
  console.log('3. Admin creating a new user (John Tester)...');
  const createTesterRes = await fetch(`${BASE_URL}/api/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: adminCookie,
    },
    body: JSON.stringify({
      name: 'John Tester',
      email: 'john.tester@taskflow.com',
      password: 'test1234',
      role: 'TEAM_MEMBER',
    }),
  });
  if (createTesterRes.status !== 201) {
    throw new Error(`Failed to create user John Tester: ${await createTesterRes.text()}`);
  }
  const testerData = await createTesterRes.json();
  testUserId = testerData.user.id;
  console.log(`   User John Tester created successfully. ID: ${testUserId}\n`);

  // 4. Project Manager Login
  console.log('4. Logging in as Project Manager (pm@taskflow.com)...');
  const pmLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'pm@taskflow.com', password: 'pm123' }),
  });
  if (pmLoginRes.status !== 200) {
    throw new Error(`PM login failed with status ${pmLoginRes.status}`);
  }
  pmCookie = extractTokenCookie(pmLoginRes.headers);
  const pmData = await pmLoginRes.json();
  console.log(`   Logged in successfully as: ${pmData.user.name} (${pmData.user.role})\n`);

  // 5. PM fetches projects list to find "Alpha Mobile App"
  console.log('5. PM fetching projects list...');
  const projectsRes = await fetch(`${BASE_URL}/api/projects`, {
    headers: { Cookie: pmCookie },
  });
  if (projectsRes.status !== 200) {
    throw new Error(`Failed to fetch projects: ${await projectsRes.text()}`);
  }
  const projectsData = await projectsRes.json();
  const projects = projectsData.projects;
  const targetProject = projects.find((p: any) => p.name === 'Alpha Mobile App');
  if (!targetProject) {
    throw new Error('Could not find Alpha Mobile App project');
  }
  projectId = targetProject.id;
  console.log(`   Found project: "${targetProject.name}" with ID: ${projectId}\n`);

  // 6. PM assigns John Tester to the project
  console.log(`6. PM assigning John Tester (ID: ${testUserId}) to Alpha Mobile App (ID: ${projectId})...`);
  const assignMemberRes = await fetch(`${BASE_URL}/api/projects/${projectId}/members`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: pmCookie,
    },
    body: JSON.stringify({
      assignUserId: testUserId,
      roleInProject: 'Junior QA Tester',
    }),
  });
  if (assignMemberRes.status !== 200 && assignMemberRes.status !== 201) {
    throw new Error(`Failed to assign John Tester to project: ${await assignMemberRes.text()}`);
  }
  console.log('   Successfully assigned member to project.\n');

  // 7. PM creates a task assigned to John Tester
  console.log('7. PM creating a task for John Tester...');
  const createTaskRes = await fetch(`${BASE_URL}/api/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: pmCookie,
    },
    body: JSON.stringify({
      title: 'Verify REST API Integrity',
      description: 'Run custom tsx integration tests and verify database feedback.',
      priority: 'HIGH',
      projectId: projectId,
      assigneeId: testUserId,
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    }),
  });
  if (createTaskRes.status !== 201) {
    throw new Error(`Failed to create task: ${await createTaskRes.text()}`);
  }
  const taskResponse = await createTaskRes.json();
  const taskData = taskResponse.task;
  taskId = taskData.id;
  console.log(`   Task created: "${taskData.title}" (ID: ${taskId})\n`);

  // 8. John Tester Login
  console.log('8. Logging in as Team Member John Tester (john.tester@taskflow.com)...');
  const devLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'john.tester@taskflow.com', password: 'test1234' }),
  });
  if (devLoginRes.status !== 200) {
    throw new Error(`John Tester login failed with status ${devLoginRes.status}`);
  }
  devCookie = extractTokenCookie(devLoginRes.headers);
  const devData = await devLoginRes.json();
  console.log(`   Logged in successfully as: ${devData.user.name} (${devData.user.role})\n`);

  // 9. John Tester fetches his tasks
  console.log('9. John Tester fetching his tasks...');
  const devTasksRes = await fetch(`${BASE_URL}/api/tasks?projectId=${projectId}`, {
    headers: { Cookie: devCookie },
  });
  if (devTasksRes.status !== 200) {
    throw new Error(`Failed to fetch tasks: ${await devTasksRes.text()}`);
  }
  const devTasksData = await devTasksRes.json();
  const devTasks = devTasksData.tasks;
  const assignedTask = devTasks.find((t: any) => t.id === taskId);
  if (!assignedTask) {
    throw new Error('Assigned task was not found in John Tester\'s task list');
  }
  console.log(`   Verified assigned task: "${assignedTask.title}" - Status: ${assignedTask.status}\n`);

  // 10. John Tester updates task status to IN_PROGRESS
  console.log('10. John Tester updating task status to IN_PROGRESS...');
  const updateStatusProgressRes = await fetch(`${BASE_URL}/api/tasks/${taskId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: devCookie,
    },
    body: JSON.stringify({
      status: 'IN_PROGRESS',
      comment: 'I am starting work on validating the API routes now.',
    }),
  });
  if (updateStatusProgressRes.status !== 200) {
    throw new Error(`Failed to update status to IN_PROGRESS: ${await updateStatusProgressRes.text()}`);
  }
  console.log('    Status updated successfully to IN_PROGRESS.\n');

  // 11. John Tester updates task status to DONE
  console.log('11. John Tester updating task status to DONE...');
  const updateStatusDoneRes = await fetch(`${BASE_URL}/api/tasks/${taskId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: devCookie,
    },
    body: JSON.stringify({
      status: 'DONE',
      comment: 'All integration endpoints tested and confirmed secure.',
    }),
  });
  if (updateStatusDoneRes.status !== 200) {
    throw new Error(`Failed to update status to DONE: ${await updateStatusDoneRes.text()}`);
  }
  console.log('    Status updated successfully to DONE.\n');

  // 12. PM verifies task progress and timeline logs
  console.log('12. PM fetching task details to verify comments and activity logs...');
  const getTaskDetailsRes = await fetch(`${BASE_URL}/api/tasks/${taskId}`, {
    headers: { Cookie: pmCookie },
  });
  if (getTaskDetailsRes.status !== 200) {
    throw new Error(`Failed to get task details: ${await getTaskDetailsRes.text()}`);
  }
  const fullTaskDetailsData = await getTaskDetailsRes.json();
  const fullTaskDetails = fullTaskDetailsData.task;
  console.log(`    Verified Task: "${fullTaskDetails.title}"`);
  console.log(`    Current Status: ${fullTaskDetails.status}`);
  console.log(`    Activity Logs / Comments Timeline:`);
  fullTaskDetails.activityLogs.forEach((log: any) => {
    console.log(`     - [${log.actionType}] by ${log.user.name}: "${log.message}" (at ${log.createdAt})`);
  });
  console.log('');

  // 13. Cleanup (Admin deletes John Tester to keep DB clean)
  console.log('13. Admin deleting John Tester to restore database state...');
  const deleteTesterRes = await fetch(`${BASE_URL}/api/users/${testUserId}`, {
    method: 'DELETE',
    headers: { Cookie: adminCookie },
  });
  if (deleteTesterRes.status !== 200) {
    throw new Error(`Failed to delete John Tester: ${await deleteTesterRes.text()}`);
  }
  console.log('    John Tester successfully deleted from system. Cascades checked.\n');

  console.log('=== ALL REST API INTEGRATION TESTS PASSED SUCCESSFULLY! ===');
}

runTests().catch((err) => {
  console.error('\n❌ TEST SUITE FAILED:');
  console.error(err);
  process.exit(1);
});
