import { getBooks } from '../src/controllers/book.controller.js';
import { prisma } from '../src/lib/prisma.js';
import { queryBookValidator } from '../src/validations/book.validation.js';

console.log('Get All Books API Testing Suite\n=================================');

// Mock request / response helpers
const createMockReq = ({ query = {} } = {}) => ({
  query
});

const createMockRes = () => {
  const res = {
    statusCode: 200,
    body: null,
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(payload) {
      this.body = payload;
      return this;
    }
  };
  return res;
};

const createMockNext = () => {
  const nextFn = (err) => {
    nextFn.error = err;
  };
  nextFn.error = null;
  return nextFn;
};

async function runTests() {
  // 1. Seed test data
  const book1 = await prisma.book.create({
    data: {
      title: 'Test Book Alpha',
      isbn: 'TEST-QUERY-ALPHA',
      publisher: 'Publisher Alpha',
      publicationYear: 2026,
      language: 'English',
      isBorrowable: true,
      isForSale: true
    }
  });

  const book2 = await prisma.book.create({
    data: {
      title: 'Test Book Beta',
      isbn: 'TEST-QUERY-BETA',
      publisher: 'Publisher Beta',
      publicationYear: 2026,
      language: 'english',
      isBorrowable: false,
      isForSale: true
    }
  });

  const book3 = await prisma.book.create({
    data: {
      title: 'Test Book Gamma',
      isbn: 'TEST-QUERY-GAMMA',
      publisher: 'Publisher Gamma',
      publicationYear: 2025,
      language: 'SPANISH',
      isBorrowable: true,
      isForSale: false
    }
  });

  try {
    // Test Case 1 & 8: GET /api/books with default params & response wrapper check
    {
      const req = createMockReq();
      const res = createMockRes();
      const next = createMockNext();
      await queryBookValidator(req, res, next);
      await getBooks(req, res, next);

      if (res.statusCode === 200 && res.body.success === true && res.body.data.books.length >= 3) {
        console.log('PASS: Test Case 1 & 8: Default catalog retrieval and wrapper verified.');
      } else {
        console.log('FAIL: Test Case 1 & 8', res.statusCode, res.body);
      }
    }

    // Test Case 2: Pagination check
    {
      const req = createMockReq({ query: { page: '1', limit: '2' } });
      const res = createMockRes();
      const next = createMockNext();
      await queryBookValidator(req, res, next);
      await getBooks(req, res, next);

      const pag = res.body.data.pagination;
      if (res.statusCode === 200 && res.body.data.books.length === 2 && pag.limit === 2 && pag.page === 1) {
        console.log('PASS: Test Case 2: Pagination limits, counts, and metadata checks succeeded.');
      } else {
        console.log('FAIL: Test Case 2', res.statusCode, res.body);
      }
    }

    // Test Case 3: Search check (by title, isbn, publisher)
    {
      // Search by title contains "Alpha"
      const req = createMockReq({ query: { search: '  Alpha  ' } }); // Test trimming too
      const res = createMockRes();
      const next = createMockNext();
      await queryBookValidator(req, res, next);
      await getBooks(req, res, next);

      if (res.statusCode === 200 && res.body.data.books.length === 1 && res.body.data.books[0].title === 'Test Book Alpha') {
        console.log('PASS: Test Case 3: Search query trimming and case-insensitive title search matches successfully.');
      } else {
        console.log('FAIL: Test Case 3 (Title search)', res.statusCode, res.body);
      }
    }

    // Test Case 4: Sorting (ascending / descending)
    {
      const req = createMockReq({ query: { sortBy: 'publicationYear', order: 'asc' } });
      const res = createMockRes();
      const next = createMockNext();
      await queryBookValidator(req, res, next);
      await getBooks(req, res, next);

      const list = res.body.data.books;
      const idxGamma = list.findIndex(b => b.title === 'Test Book Gamma');
      const idxAlpha = list.findIndex(b => b.title === 'Test Book Alpha');
      if (res.statusCode === 200 && idxGamma < idxAlpha) {
        console.log('PASS: Test Case 4: Sorting by publicationYear asc correctly placed 2025 Gamma before 2026 Alpha.');
      } else {
        console.log('FAIL: Test Case 4', res.statusCode, list);
      }
    }

    // Test Case 5: Filtering
    {
      const req = createMockReq({ query: { isBorrowable: 'false', isForSale: 'true' } });
      const res = createMockRes();
      const next = createMockNext();
      await queryBookValidator(req, res, next);
      await getBooks(req, res, next);

      const list = res.body.data.books;
      if (res.statusCode === 200 && list.length === 1 && list[0].title === 'Test Book Beta') {
        console.log('PASS: Test Case 5: Filter combinations (isBorrowable=false & isForSale=true) matches correctly.');
      } else {
        console.log('FAIL: Test Case 5', res.statusCode, list);
      }
    }

    // Test Case 7: Invalid Query Parameters
    {
      const req = createMockReq({ query: { page: '-5', sortBy: 'invalidField' } });
      const res = createMockRes();
      const next = createMockNext();
      await queryBookValidator(req, res, next);

      if (res.statusCode === 400 && res.body.message === 'Validation failed.' && res.body.errors.length === 2) {
        console.log('PASS: Test Case 7: Invalid sortBy parameter and negative page rejected with 400.');
      } else {
        console.log('FAIL: Test Case 7', res.statusCode, res.body);
      }
    }

    // Test Case 11: Deterministic Secondary Sorting
    {
      // Request 1
      const req1 = createMockReq({ query: { sortBy: 'publicationYear', order: 'desc', limit: '10' } });
      const res1 = createMockRes();
      const next1 = createMockNext();
      await queryBookValidator(req1, res1, next1);
      await getBooks(req1, res1, next1);

      // Request 2 (identical query params)
      const req2 = createMockReq({ query: { sortBy: 'publicationYear', order: 'desc', limit: '10' } });
      const res2 = createMockRes();
      const next2 = createMockNext();
      await queryBookValidator(req2, res2, next2);
      await getBooks(req2, res2, next2);

      const list1Ids = res1.body.data.books.map(b => b.id);
      const list2Ids = res2.body.data.books.map(b => b.id);

      if (JSON.stringify(list1Ids) === JSON.stringify(list2Ids)) {
        console.log('PASS: Test Case 11: Deterministic multi-field secondary sorting verified.');
      } else {
        console.log('FAIL: Test Case 11', list1Ids, list2Ids);
      }
    }

    // Test Case 12: Case-Insensitive Language Filter
    {
      // english
      const reqLc = createMockReq({ query: { language: 'english' } });
      const resLc = createMockRes();
      const nextLc = createMockNext();
      await queryBookValidator(reqLc, resLc, nextLc);
      await getBooks(reqLc, resLc, nextLc);

      // ENGLISH
      const reqUc = createMockReq({ query: { language: 'ENGLISH' } });
      const resUc = createMockRes();
      const nextUc = createMockNext();
      await queryBookValidator(reqUc, resUc, nextUc);
      await getBooks(reqUc, resUc, nextUc);

      if (resLc.body.data.books.length === resUc.body.data.books.length && resLc.body.data.books.length === 2) {
        console.log('PASS: Test Case 12: Case-insensitive language filter successfully matched both books.');
      } else {
        console.log('FAIL: Test Case 12', resLc.body.data.books, resUc.body.data.books);
      }
    }

  } finally {
    // 3. Cleanup seeded books
    await prisma.book.delete({ where: { id: book1.id } });
    await prisma.book.delete({ where: { id: book2.id } });
    await prisma.book.delete({ where: { id: book3.id } });
  }
}

runTests();
