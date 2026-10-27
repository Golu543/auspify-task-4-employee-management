const BASE_URL = 'http://localhost:5003/api';

async function runTests() {
  console.log('--- STARTING EMPLOYEE API VERIFICATION ---');
  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`[PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`[FAIL] ${name} ->`, err.message);
      failed++;
    }
  }

  await test('GET /health verifies database connection', async () => {
    const res = await fetch(`${BASE_URL}/health`);
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error('Health check failed');
  });

  await test('GET /dashboard returns organizational metrics', async () => {
    const res = await fetch(`${BASE_URL}/dashboard`);
    const data = await res.json();
    if (!data.success || typeof data.data.total_employees !== 'number') {
      throw new Error('Invalid dashboard response');
    }
  });

  await test('GET /employees retrieves seeded employee directory', async () => {
    const res = await fetch(`${BASE_URL}/employees`);
    const data = await res.json();
    if (!data.success || !Array.isArray(data.data) || data.data.length < 1) {
      throw new Error('Employees list empty or invalid');
    }
  });

  await test('POST /employees rejects duplicate Employee ID (EMP2026001)', async () => {
    const res = await fetch(`${BASE_URL}/employees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employee_code: 'EMP2026001',
        full_name: 'Duplicate Test',
        email: 'unique.test@auspify.com',
        phone: '9876543299',
        department: 'Computer Science',
        designation: 'Developer',
        joining_date: '2025-01-01',
        salary: 60000,
        status: 'Active'
      })
    });
    if (res.status !== 409) {
      throw new Error(`Expected 409 conflict, got ${res.status}`);
    }
  });

  console.log(`\nRESULTS: ${passed} Passed, ${failed} Failed`);
  if (failed > 0) process.exit(1);
}

runTests();