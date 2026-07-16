/**
 * @fileoverview Optimization recommendation engine.
 *
 * Maps identified bottlenecks to structured recommendations and maintains traceability.
 *
 * @module benchmark/recommendation.engine
 */

/**
 * Map identified bottlenecks to optimized technical recommendations.
 * Groups duplicate recommendations and appends related bottleneck IDs.
 *
 * @param {Array} bottlenecks - List of identified bottlenecks
 * @returns {Array} List of recommendations
 */
export function generateRecommendations(bottlenecks) {
  const map = new Map();

  const add = (key, baseRec, bottleneckId) => {
    if (!map.has(key)) {
      map.set(key, { ...baseRec, relatedBottlenecks: [] });
    }
    map.get(key).relatedBottlenecks.push(bottleneckId);
  };

  for (const b of bottlenecks) {
    if (
      b.category === 'Database' &&
      (b.component.toLowerCase().includes('count') ||
        b.confidenceReason.toLowerCase().includes('n+1') ||
        b.confidenceReason.toLowerCase().includes('duplicate'))
    ) {
      add(
        'n_plus_one',
        {
          title: 'Reduce duplicate queries and eliminate N+1 patterns',
          description:
            'Refactor loops executing sequential Prisma reads on children models to use select/include batch fetching.',
          expectedBenefit: 'Eliminates redundant database round trips, significantly reducing transaction and read times.',
          estimatedImplementationEffort: 'MEDIUM',
          estimatedPerformanceImpact: 'HIGH',
          riskLevel: 'MEDIUM',
        },
        b.id
      );
    } else if (
      b.category === 'Database' &&
      (b.component.toLowerCase().includes('index') ||
        b.confidenceReason.toLowerCase().includes('scan') ||
        b.component.toLowerCase().includes('slow query') ||
        b.component.toLowerCase().includes('prisma:'))
    ) {
      add(
        'indexes',
        {
          title: 'Optimize index configuration and query filters',
          description:
            'Define Postgres indexes for frequently queried columns like isDeleted and barcode, and ensure all read queries utilize WHERE constraints.',
          expectedBenefit: 'Avoids expensive full table scans, lowering CPU consumption and read latencies under load.',
          estimatedImplementationEffort: 'LOW',
          estimatedPerformanceImpact: 'HIGH',
          riskLevel: 'LOW',
        },
        b.id
      );
    } else if (b.category === 'Database' && b.confidenceReason.toLowerCase().includes('joins')) {
      add(
        'select_clauses',
        {
          title: 'Optimize Prisma select clauses and flatten relation structures',
          description:
            'Minimize select payload widths and flatten multi-level relation includes (e.g. including >2 levels of related models).',
          expectedBenefit: 'Reduces SQL join overhead and response payload serialization durations.',
          estimatedImplementationEffort: 'LOW',
          estimatedPerformanceImpact: 'MEDIUM',
          riskLevel: 'LOW',
        },
        b.id
      );
    } else if (b.category === 'Connection Pool') {
      add(
        'pool_size',
        {
          title: 'Tune Prisma connection pool size',
          description:
            'Increase connection_limit parameter in DATABASE_URL or implement database proxies like PgBouncer.',
          expectedBenefit: 'Prevents connection saturation and handshake delays under concurrent load.',
          estimatedImplementationEffort: 'LOW',
          estimatedPerformanceImpact: 'HIGH',
          riskLevel: 'LOW',
        },
        b.id
      );
    } else if (b.category === 'Transaction') {
      add(
        'transaction_bounds',
        {
          title: 'Optimize database transaction boundaries',
          description:
            'Tune transaction execution scopes by isolating validations outside Prisma transaction blocks.',
          expectedBenefit: 'Releases database locks faster, improving write throughput.',
          estimatedImplementationEffort: 'MEDIUM',
          estimatedPerformanceImpact: 'HIGH',
          riskLevel: 'MEDIUM',
        },
        b.id
      );
    } else if (b.category === 'Read') {
      add(
        'response_caching',
        {
          title: 'Implement response caching for read-heavy operations',
          description:
            'Introduce Redis or in-memory caching layers on list/search endpoints (e.g. books listing, analytics stats) that rarely change.',
          expectedBenefit: 'Bypasses the database entirely, reducing endpoint latencies to < 5ms.',
          estimatedImplementationEffort: 'MEDIUM',
          estimatedPerformanceImpact: 'CRITICAL',
          riskLevel: 'MEDIUM',
        },
        b.id
      );
    } else if (b.category === 'CPU-bound') {
      add(
        'cluster_scaling',
        {
          title: 'Enable horizontal scaling and resolve loop blocks',
          description:
            'Spawn multiple Node.js workers using the Cluster module or scale container replicas in Kubernetes.',
          expectedBenefit: 'Spreads heavy computational loads across multiple CPU cores, lowering latency drift.',
          estimatedImplementationEffort: 'MEDIUM',
          estimatedPerformanceImpact: 'HIGH',
          riskLevel: 'LOW',
        },
        b.id
      );
    } else if (b.category === 'Memory-bound') {
      add(
        'heap_profiling',
        {
          title: 'Profile heap allocations and fix handle leaks',
          description:
            'Analyze active handle leaks (unclosed sockets/timers) and profile heap snapshots to find memory retention paths.',
          expectedBenefit: 'Stabilizes memory usage during long running processes, preventing out-of-memory crashes.',
          estimatedImplementationEffort: 'HIGH',
          estimatedPerformanceImpact: 'HIGH',
          riskLevel: 'LOW',
        },
        b.id
      );
    }
  }

  // Fallback: preventative recommendations if no bottlenecks are detected
  if (map.size === 0) {
    map.set('preventative', {
      title: 'Define preventative read caching and query indexes',
      description:
        'Implement memory caching for static catalog queries and index isDeleted database fields.',
      expectedBenefit: 'Guarantees scalability headroom as the user enrollment grows.',
      estimatedImplementationEffort: 'LOW',
      estimatedPerformanceImpact: 'MEDIUM',
      riskLevel: 'LOW',
      relatedBottlenecks: [],
    });
  }

  return Array.from(map.values());
}
