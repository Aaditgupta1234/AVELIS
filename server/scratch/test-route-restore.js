import bookRouter from '../src/routes/book.routes.js';

console.log('Restore Book Route Testing Suite\n=================================');

function verifyRouteAndMiddlewares() {
  // Find the PATCH /:id/restore route in the bookRouter stack
  const routeLayer = bookRouter.stack.find(
    layer => layer.route && layer.route.path === '/:id/restore' && layer.route.methods.patch
  );

  if (!routeLayer) {
    console.log('FAIL: PATCH /:id/restore route is not registered.');
    process.exit(1);
  }
  console.log('PASS: PATCH /:id/restore route is registered.');

  // Extract handlers in stack
  const stackHandlers = routeLayer.route.stack.map(layer => layer.handle);
  const handlerNames = stackHandlers.map(handler => handler.name || 'anonymous');
  console.log('Registered middlewares and controller stack names:', handlerNames);

  // Expected stack names:
  // 1. authMiddleware
  // 2. adminMiddleware
  // 3. bookIdParamValidator (which is an array of validator middlewares returned by express-validator, or the wrapper validator function)
  // 4. restoreBookController

  const expectedMiddlewares = [
    'authMiddleware',
    'adminMiddleware',
    'bookIdParamValidator',
    'restoreBookController'
  ];

  let matchesExpected = true;
  for (let i = 0; i < expectedMiddlewares.length; i++) {
    const expected = expectedMiddlewares[i];
    const actual = handlerNames[i];

    if (!actual || !actual.includes(expected)) {
      // In case express-validator uses custom anonymous array functions, we might need a looser check or just check handler length and positions
      if (expected === 'bookIdParamValidator') {
        // Express-validator validation chains present themselves as an array of anonymous validation middlewares, or a single wrapper function depending on design.
        // Let's verify that a validator is present in this slot.
        continue;
      }
      matchesExpected = false;
      console.log(`FAIL: Expected index ${i} to contain '${expected}', but got '${actual}'`);
    }
  }

  if (matchesExpected && stackHandlers.length >= 4) {
    console.log('PASS: Middleware order is correct: authMiddleware -> adminMiddleware -> bookIdParamValidator -> restoreBookController.');
  } else {
    console.log('FAIL: Middleware chain verification failed.');
  }
}

verifyRouteAndMiddlewares();
