const BASE_URL = 'http://localhost:5000/api/v1';

async function runTests() {
  console.log('🧪 Testing Author & Category Management Endpoints...\n');

  try {
    // 1. Admin Login
    console.log('1. Logging in as Admin...');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@avelis.com',
        password: 'Admin123!',
      }),
    });
    const loginData = await loginRes.json();
    if (!loginData.success || !loginData.data?.token) {
      throw new Error(`Admin login failed: ${JSON.stringify(loginData)}`);
    }
    const token = loginData.data.token;
    console.log('   ✅ Admin login successful!\n');

    const authHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    // 2. GET Categories
    console.log('2. Fetching categories via GET /api/v1/categories...');
    const getCatRes = await fetch(`${BASE_URL}/categories`);
    const getCatData = await getCatRes.json();
    console.log(`   Fetched ${getCatData.data?.length || 0} categories.`);
    console.log(`   Sample category:`, getCatData.data?.[0]);
    if (!getCatData.success || !Array.isArray(getCatData.data)) {
      throw new Error('GET /categories failed');
    }
    console.log('   ✅ GET /categories test passed!\n');

    // 3. Create Custom Category with Whitespace Normalization
    console.log('3. Creating category with whitespace "  Quantum   Computing  "...');
    const createCatRes = await fetch(`${BASE_URL}/categories`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        name: '  Quantum   Computing  ',
        description: 'Subatomic physics and quantum information processing.',
      }),
    });
    const createCatData = await createCatRes.json();
    console.log('   Create category response:', createCatData);
    if (!createCatData.success || createCatData.data?.name !== 'Quantum Computing') {
      throw new Error(`Create category failed: ${JSON.stringify(createCatData)}`);
    }
    const createdCatId = createCatData.data.id;
    console.log('   ✅ Category created & normalized to "Quantum Computing"!\n');

    // 4. Duplicate Category Check (409 Conflict)
    console.log('4. Testing case-insensitive duplicate creation ("quantum computing")...');
    const dupCatRes = await fetch(`${BASE_URL}/categories`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        name: 'quantum computing',
        description: 'Duplicate attempt',
      }),
    });
    console.log(`   Duplicate status code: ${dupCatRes.status} (expected 409)`);
    if (dupCatRes.status !== 409) {
      throw new Error(`Expected status 409 for duplicate, got ${dupCatRes.status}`);
    }
    console.log('   ✅ Duplicate category correctly rejected with 409 Conflict!\n');

    // 5. Create Custom Author with Whitespace Normalization
    console.log('5. Creating author with whitespace "  Carl   Sagan  "...');
    const createAuthRes = await fetch(`${BASE_URL}/authors`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        fullName: '  Carl   Sagan  ',
        biography: 'Astronomer, planetary scientist, and science communicator.',
      }),
    });
    const createAuthData = await createAuthRes.json();
    console.log('   Create author response:', createAuthData);
    if (!createAuthData.success || createAuthData.data?.fullName !== 'Carl Sagan') {
      throw new Error(`Create author failed: ${JSON.stringify(createAuthData)}`);
    }
    const createdAuthId = createAuthData.data.id;
    console.log('   ✅ Author created & normalized to "Carl Sagan"!\n');

    // 6. Soft Delete Custom Category
    console.log('6. Soft deleting category "Quantum Computing"...');
    const delCatRes = await fetch(`${BASE_URL}/categories/${createdCatId}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    const delCatData = await delCatRes.json();
    console.log('   Delete response:', delCatData);
    if (!delCatData.success) {
      throw new Error(`Soft delete category failed: ${JSON.stringify(delCatData)}`);
    }
    console.log('   ✅ Soft delete category test passed!\n');

    // 7. System Protection (Attempting to delete isSystem: true category)
    const systemCategory = getCatData.data.find((c) => c.isSystem);
    if (systemCategory) {
      console.log(`7. Testing deletion of System Core category "${systemCategory.name}"...`);
      const sysDelRes = await fetch(`${BASE_URL}/categories/${systemCategory.id}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      console.log(`   System category delete status code: ${sysDelRes.status} (expected 400)`);
      if (sysDelRes.status !== 400) {
        throw new Error(`Expected 400 Bad Request for system category deletion, got ${sysDelRes.status}`);
      }
      console.log('   ✅ System category deletion correctly blocked with 400 Bad Request!\n');
    }

    // 8. Restore Soft-Deleted Category
    console.log('8. Restoring soft-deleted category "Quantum Computing"...');
    const restoreCatRes = await fetch(`${BASE_URL}/categories/${createdCatId}/restore`, {
      method: 'PATCH',
      headers: authHeaders,
    });
    const restoreCatData = await restoreCatRes.json();
    console.log('   Restore response:', restoreCatData);
    if (!restoreCatData.success || restoreCatData.data?.isDeleted !== false) {
      throw new Error(`Restore category failed: ${JSON.stringify(restoreCatData)}`);
    }
    console.log('   ✅ Restore category test passed! RestoredBy:', restoreCatData.data.restoredBy, '\n');

    console.log('🎉 ALL TESTS PASSED SUCCESSFULLY! 🎉');
  } catch (err) {
    console.error('❌ Test failed with error:', err.message);
    process.exit(1);
  }
}

runTests();
