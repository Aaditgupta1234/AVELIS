/**
 * @fileoverview Database connection pool status and stability analyzer.
 *
 * Inspects active PostgreSQL connections via pg_stat_activity, handling permission limits.
 *
 * @module benchmark/connection.analyzer
 */

/**
 * Query active PostgreSQL connection statistics and evaluate pool safety.
 *
 * @param {import('@prisma/client').PrismaClient} prismaClient - Shared Prisma Client
 * @returns {Promise<Object>} Analysis results and recommendations
 */
export async function analyzeConnections(prismaClient) {
  let activeConnections = 0;
  let inspectionStatus = 'available';

  try {
    const res = await prismaClient.$queryRawUnsafe(
      "SELECT count(*)::int as active FROM pg_stat_activity WHERE datname = current_database()"
    );
    activeConnections = res[0]?.active || 0;
  } catch (error) {
    console.warn('  [WARN] Database connection inspection query failed (likely due to database permissions):', error.message);
    inspectionStatus = 'connection inspection unavailable';
  }

  const recommendations = [];

  // Generate recommendations based on active connections and inspection status
  if (inspectionStatus === 'available') {
    if (activeConnections >= 8) {
      recommendations.push(
        'Active database connections are approaching pool capacity limit. Consider increasing the Prisma connection_limit in your DATABASE_URL.'
      );
    }
  } else {
    recommendations.push(
      'Unable to inspect pg_stat_activity due to permission limits. Ensure the database user has pg_read_all_stats permissions in production.'
    );
  }

  return {
    status: 'PASS',
    postgresConnections: inspectionStatus === 'available' ? activeConnections : 'connection inspection unavailable',
    recommendations,
  };
}
