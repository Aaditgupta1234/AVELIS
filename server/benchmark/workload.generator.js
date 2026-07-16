/**
 * @fileoverview Traffic generator and client simulator for AVELIS API.
 *
 * Implements randomized seedable workload distribution and failure categorizations.
 *
 * @module benchmark/workload.generator
 */

export class LCG {
  constructor(seed) {
    this.seed = seed || 123456789;
  }
  next() {
    this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
    return this.seed / 4294967296;
  }
}

export function createWorkloadGenerator(data, tokens, seed = null) {
  const prng = seed !== null ? new LCG(seed) : null;

  const selectRandom = () => (prng ? prng.next() : Math.random());

  const operations = [
    { name: 'login', weight: 10 },
    { name: 'books', weight: 35 },
    { name: 'borrow', weight: 10 },
    { name: 'return', weight: 5 },
    { name: 'reservation', weight: 10 },
    { name: 'review', weight: 10 },
    { name: 'dashboard', weight: 10 },
    { name: 'reporting', weight: 10 },
  ];

  // Build cumulative weights
  const cumulative = [];
  let sum = 0;
  for (const op of operations) {
    sum += op.weight;
    cumulative.push({ name: op.name, limit: sum });
  }

  const selectOperation = () => {
    const roll = selectRandom() * 100;
    for (const item of cumulative) {
      if (roll <= item.limit) {
        return item.name;
      }
    }
    return 'books'; // fallback
  };

  const execute = async (baseUrl, operation) => {
    const headers = { 'Content-Type': 'application/json' };
    let method = 'GET';
    let path = '';
    let body = null;

    switch (operation) {
      case 'login':
        method = 'POST';
        path = '/auth/login';
        body = { email: data.memberEmail, password: data.memberPassword };
        break;
      case 'books':
        method = 'GET';
        path = '/books';
        break;
      case 'borrow':
        method = 'POST';
        path = '/loans';
        headers['Authorization'] = `Bearer ${tokens.member}`;
        body = { bookCopyId: data.copyId2 };
        break;
      case 'return':
        method = 'POST';
        path = `/loans/${data.loanId}/return`;
        headers['Authorization'] = `Bearer ${tokens.member}`;
        break;
      case 'reservation':
        method = 'POST';
        path = '/reservations';
        headers['Authorization'] = `Bearer ${tokens.member}`;
        body = { bookId: data.bookId2 };
        break;
      case 'review':
        method = 'POST';
        path = '/reviews';
        headers['Authorization'] = `Bearer ${tokens.member}`;
        body = { bookId: data.bookId, rating: 4, comment: 'load review comment' };
        break;
      case 'dashboard':
        method = 'GET';
        path = '/admin/dashboard/summary';
        headers['Authorization'] = `Bearer ${tokens.admin}`;
        break;
      case 'reporting':
        method = 'GET';
        path = '/admin/dashboard/reports/overdue';
        headers['Authorization'] = `Bearer ${tokens.admin}`;
        break;
      default:
        path = '/books';
    }

    try {
      const response = await fetch(`${baseUrl}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(2000), // 2s timeout
      });

      // Consume response body to prevent socket leakage/bloat
      await response.text();

      if (response.status >= 400) {
        const err = new Error('http_error');
        err.statusCode = response.status;
        throw err;
      }
      return response.status;
    } catch (error) {
      if (error.name === 'TimeoutError' || error.name === 'AbortError' || error.message?.includes('timeout')) {
        const err = new Error('timeout');
        throw err;
      }
      if (error.message === 'http_error') {
        throw error;
      }
      const err = new Error('network_error');
      err.originalMessage = error.message;
      throw err;
    }
  };

  return {
    selectOperation,
    execute,
  };
}
