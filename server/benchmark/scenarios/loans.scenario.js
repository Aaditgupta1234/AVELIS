/**
 * @fileoverview Loans benchmark scenarios.
 *
 * Endpoints:
 *   Read  (4): list, active, history, get-by-id
 *   Write (3): borrow, return, renew
 *
 * Write endpoints use beforeIteration/afterIteration to create fresh DB state
 * before each iteration, scaling safely to any iteration count.
 *
 * @module benchmark/scenarios/loans.scenario
 */

import { CopyStatus, CopyCondition, LoanStatus } from '@prisma/client';

// ---------------------------------------------------------------------------
// Per-iteration state (write endpoints only)
// ---------------------------------------------------------------------------

/** Mutable cell for the copy created fresh each borrow iteration */
const borrowState = { copyId: null };

/** Mutable cell for the loan created fresh each return/renew iteration */
const returnState = { loanId: null, copyId: null };
const renewState  = { loanId: null, copyId: null };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create a fresh AVAILABLE copy for a borrow iteration */
const createFreshCopy = async (prisma, bookId) => {
  const copy = await prisma.bookCopy.create({
    data: {
      bookId,
      barcode: `bench-borrow-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      condition: CopyCondition.GOOD,
      status: CopyStatus.AVAILABLE,
    },
    select: { id: true },
  });
  return copy.id;
};

/** Create a fresh active BORROWED loan for return/renew iterations */
const createFreshLoan = async (prisma, bookId, memberUserId) => {
  const copy = await prisma.bookCopy.create({
    data: {
      bookId,
      barcode: `bench-loan-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      condition: CopyCondition.GOOD,
      status: CopyStatus.BORROWED,
    },
    select: { id: true },
  });
  const loan = await prisma.loan.create({
    data: {
      userId: memberUserId,
      copyId: copy.id,
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      status: LoanStatus.BORROWED,
      fineAmount: 0,
      renewCount: 0,
    },
    select: { id: true },
  });
  return { loanId: loan.id, copyId: copy.id };
};

/** Delete a copy and its loan (for afterIteration cleanup) */
const deleteLoanAndCopy = async (prisma, loanId, copyId) => {
  if (loanId) {
    await prisma.loan.deleteMany({ where: { id: loanId } });
  }
  if (copyId) {
    await prisma.bookCopy.deleteMany({ where: { id: copyId } });
  }
};

// ---------------------------------------------------------------------------
// Scenario
// ---------------------------------------------------------------------------

export default {
  name: 'loans',
  description: 'Loan management: list, active, history, get, borrow, return, renew',

  endpoints: [
    // ── loans-list (admin) ───────────────────────────────────────────────────
    {
      name: 'loans-list',
      tags: ['read', 'authenticated', 'admin', 'database'],
      method: 'GET',
      readOnly: true,
      expectedStatus: 200,

      buildUrl: (base) => `${base}/loans?page=1&limit=10`,
      buildHeaders: (tokens) => ({ Authorization: `Bearer ${tokens.admin}` }),
      buildBody: () => undefined,
    },

    // ── loans-active (member) ────────────────────────────────────────────────
    {
      name: 'loans-active',
      tags: ['read', 'authenticated', 'member', 'database'],
      method: 'GET',
      readOnly: true,
      expectedStatus: 200,

      buildUrl: (base) => `${base}/loans/active`,
      buildHeaders: (tokens) => ({ Authorization: `Bearer ${tokens.member}` }),
      buildBody: () => undefined,
    },

    // ── loans-history (member) ───────────────────────────────────────────────
    {
      name: 'loans-history',
      tags: ['read', 'authenticated', 'member', 'database'],
      method: 'GET',
      readOnly: true,
      expectedStatus: 200,

      buildUrl: (base) => `${base}/loans/history`,
      buildHeaders: (tokens) => ({ Authorization: `Bearer ${tokens.member}` }),
      buildBody: () => undefined,
    },

    // ── loans-get-by-id (admin) ──────────────────────────────────────────────
    {
      name: 'loans-get-by-id',
      tags: ['read', 'authenticated', 'admin', 'database'],
      method: 'GET',
      readOnly: true,
      expectedStatus: 200,

      buildUrl: (base, data) => `${base}/loans/${data.loanId}`,
      buildHeaders: (tokens) => ({ Authorization: `Bearer ${tokens.admin}` }),
      buildBody: () => undefined,
    },

    // ── loans-borrow (member, write) ─────────────────────────────────────────
    {
      name: 'loans-borrow',
      tags: ['write', 'authenticated', 'member', 'database', 'transaction'],
      method: 'POST',
      readOnly: false,
      expectedStatus: 201,

      buildUrl: (base) => `${base}/loans`,
      buildHeaders: (tokens) => ({ Authorization: `Bearer ${tokens.member}` }),
      buildBody: () => ({ bookCopyId: borrowState.copyId }),

      beforeIteration: async (prisma, data) => {
        // Create a fresh AVAILABLE copy each iteration
        borrowState.copyId = await createFreshCopy(prisma, data.bookId);
      },

      afterIteration: async (prisma) => {
        // Find and delete the loan created by the borrow request, then delete the copy
        if (borrowState.copyId) {
          const loan = await prisma.loan.findFirst({
            where: { copyId: borrowState.copyId },
            select: { id: true },
          });
          await deleteLoanAndCopy(prisma, loan?.id, borrowState.copyId);
          borrowState.copyId = null;
        }
      },

      cleanup: async (prisma) => {
        // Catch-all: delete any remaining bench-borrow copies
        await prisma.bookCopy.deleteMany({
          where: { barcode: { startsWith: 'bench-borrow-' } },
        });
      },
    },

    // ── loans-return (member, write) ─────────────────────────────────────────
    {
      name: 'loans-return',
      tags: ['write', 'authenticated', 'member', 'database', 'transaction'],
      method: 'POST',
      readOnly: false,
      expectedStatus: 200,

      buildUrl: (base) => `${base}/loans/${returnState.loanId}/return`,
      buildHeaders: (tokens) => ({ Authorization: `Bearer ${tokens.member}` }),
      buildBody: () => undefined,

      beforeIteration: async (prisma, data) => {
        const result = await createFreshLoan(prisma, data.bookId, data.memberUserId);
        returnState.loanId = result.loanId;
        returnState.copyId = result.copyId;
      },

      afterIteration: async (prisma) => {
        // After a successful return, the loan status is RETURNED; clean up copy
        await deleteLoanAndCopy(prisma, returnState.loanId, returnState.copyId);
        returnState.loanId = null;
        returnState.copyId = null;
      },

      cleanup: async (prisma) => {
        await prisma.bookCopy.deleteMany({
          where: { barcode: { startsWith: 'bench-loan-' } },
        });
      },
    },

    // ── loans-renew (member, write) ──────────────────────────────────────────
    {
      name: 'loans-renew',
      tags: ['write', 'authenticated', 'member', 'database'],
      method: 'PATCH',
      readOnly: false,
      expectedStatus: 200,

      buildUrl: (base) => `${base}/loans/${renewState.loanId}/renew`,
      buildHeaders: (tokens) => ({ Authorization: `Bearer ${tokens.member}` }),
      buildBody: () => undefined,

      beforeIteration: async (prisma, data) => {
        const result = await createFreshLoan(prisma, data.bookId, data.memberUserId);
        renewState.loanId = result.loanId;
        renewState.copyId = result.copyId;
      },

      afterIteration: async (prisma) => {
        await deleteLoanAndCopy(prisma, renewState.loanId, renewState.copyId);
        renewState.loanId = null;
        renewState.copyId = null;
      },

      cleanup: async (prisma) => {
        await prisma.bookCopy.deleteMany({
          where: { barcode: { startsWith: 'bench-loan-' } },
        });
      },
    },
  ],
};
