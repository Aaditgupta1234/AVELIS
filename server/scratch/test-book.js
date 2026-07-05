import { createBook, getBooks, getBookById, updateBook, deleteBook, restoreBook } from '../src/controllers/book.controller.js';
import bookRouter from '../src/routes/book.routes.js';
import fs from 'fs';
import path from 'path';

console.log('Book Module Foundation Testing Suite\n====================================');

// Helper to mock Express response
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

// Helper to mock NextFunction
const createMockNext = () => {
  const nextFn = (err) => {
    nextFn.error = err;
  };
  nextFn.error = null;
  return nextFn;
};

async function runTests() {
  // Test Case 1: Check Status Codes and Response Format
  // POST /api/books -> HTTP 201 Created
  {
    const req = { body: {} };
    const res = createMockRes();
    const next = createMockNext();
    await createBook(req, res, next);
    if (res.statusCode === 201 && res.body.success === true && res.body.message.includes('placeholder')) {
      console.log('PASS: Test Case 1 (POST) status code 201 and wrapper check.');
    } else {
      console.log('FAIL: Test Case 1 (POST)', res.statusCode, res.body);
    }
  }

  // GET /api/books -> HTTP 200 OK
  {
    const req = { query: {} };
    const res = createMockRes();
    const next = createMockNext();
    await getBooks(req, res, next);
    if (res.statusCode === 200 && res.body.success === true) {
      console.log('PASS: Test Case 1 (GET /) status code 200 and wrapper check.');
    } else {
      console.log('FAIL: Test Case 1 (GET /)', res.statusCode, res.body);
    }
  }

  // GET /api/books/:id -> HTTP 200 OK
  {
    const req = { params: { id: 'test-id' } };
    const res = createMockRes();
    const next = createMockNext();
    await getBookById(req, res, next);
    if (res.statusCode === 200 && res.body.success === true) {
      console.log('PASS: Test Case 1 (GET /:id) status code 200 and wrapper check.');
    } else {
      console.log('FAIL: Test Case 1 (GET /:id)', res.statusCode, res.body);
    }
  }

  // PATCH /api/books/:id -> HTTP 200 OK
  {
    const req = { params: { id: 'test-id' }, body: {} };
    const res = createMockRes();
    const next = createMockNext();
    await updateBook(req, res, next);
    if (res.statusCode === 200 && res.body.success === true) {
      console.log('PASS: Test Case 1 (PATCH /:id) status code 200 and wrapper check.');
    } else {
      console.log('FAIL: Test Case 1 (PATCH /:id)', res.statusCode, res.body);
    }
  }

  // DELETE /api/books/:id -> HTTP 200 OK
  {
    const req = { params: { id: 'test-id' } };
    const res = createMockRes();
    const next = createMockNext();
    await deleteBook(req, res, next);
    if (res.statusCode === 200 && res.body.success === true) {
      console.log('PASS: Test Case 1 (DELETE) status code 200 and wrapper check.');
    } else {
      console.log('FAIL: Test Case 1 (DELETE)', res.statusCode, res.body);
    }
  }

  // PATCH /api/books/:id/restore -> HTTP 200 OK
  {
    const req = { params: { id: 'test-id' } };
    const res = createMockRes();
    const next = createMockNext();
    await restoreBook(req, res, next);
    if (res.statusCode === 200 && res.body.success === true) {
      console.log('PASS: Test Case 1 (PATCH /restore) status code 200 and wrapper check.');
    } else {
      console.log('FAIL: Test Case 1 (PATCH /restore)', res.statusCode, res.body);
    }
  }

  // Test Case 2: Controller Delegation to matching services
  {
    const controllerPath = path.resolve('./src/controllers/book.controller.js');
    const controllerContent = fs.readFileSync(controllerPath, 'utf8');

    const delegatesCreate = controllerContent.includes('bookService.createBook');
    const delegatesGetBooks = controllerContent.includes('bookService.getBooks');
    const delegatesGetById = controllerContent.includes('bookService.getBookById');
    const delegatesUpdate = controllerContent.includes('bookService.updateBook');
    const delegatesDelete = controllerContent.includes('bookService.deleteBook');
    const delegatesRestore = controllerContent.includes('bookService.restoreBook');

    if (delegatesCreate && delegatesGetBooks && delegatesGetById && delegatesUpdate && delegatesDelete && delegatesRestore) {
      console.log('PASS: Test Case 2: Controller delegates execution to matching service function.');
    } else {
      console.log('FAIL: Test Case 2: Controller delegation mismatch.', {
        delegatesCreate, delegatesGetBooks, delegatesGetById, delegatesUpdate, delegatesDelete, delegatesRestore
      });
    }
  }

  // Test Case 3 & 5: Prisma and Express Import Isolation & Architecture checks
  {
    const controllerPath = path.resolve('./src/controllers/book.controller.js');
    const servicePath = path.resolve('./src/services/book.service.js');
    const routesPath = path.resolve('./src/routes/book.routes.js');

    const controllerContent = fs.readFileSync(controllerPath, 'utf8');
    const serviceContent = fs.readFileSync(servicePath, 'utf8');
    const routesContent = fs.readFileSync(routesPath, 'utf8');

    const hasControllerPrisma = controllerContent.includes('@prisma/client') || controllerContent.includes('prisma.');
    const hasServicePrisma = serviceContent.includes('@prisma/client') || serviceContent.includes('prisma.');

    if (!hasControllerPrisma && !hasServicePrisma) {
      console.log('PASS: Test Case 3: Controllers and services do not import or access Prisma client.');
    } else {
      console.log('FAIL: Test Case 3: Prisma leakage found.', { hasControllerPrisma, hasServicePrisma });
    }

    const hasExpressInService = serviceContent.includes("from 'express'") || serviceContent.includes('Request') || serviceContent.includes('Response');
    if (!hasExpressInService) {
      console.log('PASS: Test Case 5a: Services do not import Express request/response objects.');
    } else {
      console.log('FAIL: Test Case 5a: Express imported in Service.');
    }

    const hasValidationInRoutes = routesContent.includes('book.validation.js') || routesContent.includes('book.validation');
    if (!hasValidationInRoutes) {
      console.log('PASS: Test Case 5b: Validation module is not imported by book.routes.js in Phase 8.1.');
    } else {
      console.log('FAIL: Test Case 5b: Validation imported in routes.');
    }
  }

  // Test Case 4: Router Verification
  {
    const stack = bookRouter.stack;
    const paths = stack.map(layer => layer.route ? layer.route.path : null).filter(Boolean);
    const expectedPaths = ['/', '/', '/:id', '/:id', '/:id', '/:id/restore'];
    
    if (JSON.stringify(paths.sort()) === JSON.stringify(expectedPaths.sort())) {
      console.log('PASS: Test Case 4: Book router registered all 6 skeleton routes successfully.');
    } else {
      console.log('FAIL: Test Case 4: Routes mapped in router stack did not match expected list.', paths);
    }
  }
}

runTests();
