/**
 * @fileoverview Priority ranking and performance health scoring engine.
 *
 * Implements weighted recommendation priority calculations and severity-deductible health scores.
 *
 * @module benchmark/priority.engine
 */

import { analysisConfig } from './analysis.config.js';

const IMPACT_SCORES = { CRITICAL: 10, HIGH: 8, MEDIUM: 5, LOW: 2 };
const EFFORT_SCORES = { LOW: 10, MEDIUM: 6, HIGH: 2 }; // Lower effort = higher priority score
const RISK_SCORES = { LOW: 10, MEDIUM: 5, HIGH: 1 };   // Lower risk = higher priority score

/**
 * Score and rank recommendations by priority.
 *
 * @param {Array} recommendations - List of raw recommendations
 * @returns {Array} List of recommendations with scores, ranks, and sorted by priority descending
 */
export function calculatePriorityRankings(recommendations) {
  const { IMPACT_WEIGHT, EFFORT_WEIGHT, RISK_WEIGHT } = analysisConfig.PRIORITY_WEIGHTS;

  const ranked = recommendations.map((rec) => {
    const impactVal = IMPACT_SCORES[rec.estimatedPerformanceImpact] || 5;
    const effortVal = EFFORT_SCORES[rec.estimatedImplementationEffort] || 6;
    const riskVal = RISK_SCORES[rec.riskLevel] || 5;

    const score = impactVal * IMPACT_WEIGHT + effortVal * EFFORT_WEIGHT + riskVal * RISK_WEIGHT;

    let priorityRank = 'MEDIUM';
    if (score >= 7.5) {
      priorityRank = 'CRITICAL';
    } else if (score >= 6.0) {
      priorityRank = 'HIGH';
    } else if (score >= 4.0) {
      priorityRank = 'MEDIUM';
    } else {
      priorityRank = 'LOW';
    }

    return {
      ...rec,
      score,
      priorityRank,
    };
  });

  // Sort by score descending
  return ranked.sort((a, b) => b.score - a.score);
}

/**
 * Calculate the overall Performance Health Score of the backend (0-100).
 *
 * @param {Array} bottlenecks - List of identified bottlenecks
 * @returns {number} Calculated health score
 */
export function calculateHealthScore(bottlenecks) {
  let score = 100;

  for (const b of bottlenecks) {
    if (b.severity === 'CRITICAL') {
      score -= 15;
    } else if (b.severity === 'HIGH') {
      score -= 8;
    } else if (b.severity === 'MEDIUM') {
      score -= 4;
    } else if (b.severity === 'LOW') {
      score -= 1;
    }
  }

  return Math.min(100, Math.max(0, score));
}
