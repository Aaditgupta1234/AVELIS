async function runTests() {
  console.log('--- 1. Login as Admin ---');
  const loginRes = await fetch('http://localhost:5000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@avelis.com', password: 'Admin123!' }),
  }).then((r) => r.json());

  const token = loginRes.data.token;
  console.log('✅ Admin Token Acquired.');

  // 1. Valid Cover PNG Upload with Magic Bytes
  console.log('\n--- 2. Upload Valid Cover PNG ---');
  const pngHeader = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1, 0, 0,
    0, 1, 8, 6, 0, 0, 0, 31, 215, 196, 203,
  ]);
  const formData1 = new FormData();
  formData1.append('file', new Blob([pngHeader], { type: 'image/png' }), 'test-cover.png');

  const coverRes = await fetch('http://localhost:5000/api/v1/uploads/book-cover', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData1,
  }).then((r) => r.json());

  console.log('Cover Result:', JSON.stringify(coverRes, null, 2));

  // 2. Valid PDF Upload with Magic Bytes
  console.log('\n--- 3. Upload Valid PDF Document ---');
  const pdfHeader = Buffer.from(
    '%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF'
  );
  const formData2 = new FormData();
  formData2.append('file', new Blob([pdfHeader], { type: 'application/pdf' }), 'test-book.pdf');

  const pdfRes = await fetch('http://localhost:5000/api/v1/uploads/book-pdf', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData2,
  }).then((r) => r.json());

  console.log('PDF Result:', JSON.stringify(pdfRes, null, 2));

  // 3. Security Magic Byte Spoofing Test
  console.log('\n--- 4. Security Magic Byte Rejection Test ---');
  const fakePdfHeader = Buffer.from('THIS IS A FAKE FILE DISGUISED AS PDF HEADER ATTEMPTS TO SPOOF VALIDATION');
  const formData3 = new FormData();
  formData3.append('file', new Blob([fakePdfHeader], { type: 'application/pdf' }), 'virus.pdf');

  const spoofRes = await fetch('http://localhost:5000/api/v1/uploads/book-pdf', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData3,
  }).then((r) => r.json());

  console.log('Spoofing Result (Should be rejected with 400):', JSON.stringify(spoofRes, null, 2));

  // 4. Role Restriction Test (No token)
  console.log('\n--- 5. Unauthenticated Upload Test ---');
  const unauthRes = await fetch('http://localhost:5000/api/v1/uploads/book-pdf', {
    method: 'POST',
    body: formData2,
  }).then((r) => r.json());

  console.log('Unauthenticated Result (Should be 401):', JSON.stringify(unauthRes, null, 2));
}

runTests().catch(console.error);
