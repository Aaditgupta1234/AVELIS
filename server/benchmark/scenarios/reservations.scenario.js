/**
 * @fileoverview Reservations benchmark scenarios.
 *
 * Endpoints:
 *   Read  (3): list (admin), mine (member), get-by-id (member)
 *   Write (2): create, cancel
 *
 * @module benchmark/scenarios/reservations.scenario
 */

import { ReservationStatus } from '@prisma/client';

// Per-iteration state for write endpoints
const createState  = { reservationId: null };
const cancelState  = { reservationId: null };

export default {
  name: 'reservations',
  description: 'Reservation management: list, mine, get, create, cancel',

  endpoints: [
    // ── reservations-list (admin) ────────────────────────────────────────────
    {
      name: 'reservations-list',
      tags: ['read', 'authenticated', 'admin', 'database'],
      method: 'GET',
      readOnly: true,
      expectedStatus: 200,

      buildUrl: (base) => `${base}/reservations?page=1&limit=10`,
      buildHeaders: (tokens) => ({ Authorization: `Bearer ${tokens.admin}` }),
      buildBody: () => undefined,
    },

    // ── reservations-mine (member) ───────────────────────────────────────────
    {
      name: 'reservations-mine',
      tags: ['read', 'authenticated', 'member', 'database'],
      method: 'GET',
      readOnly: true,
      expectedStatus: 200,

      buildUrl: (base) => `${base}/reservations/me`,
      buildHeaders: (tokens) => ({ Authorization: `Bearer ${tokens.member}` }),
      buildBody: () => undefined,
    },

    // ── reservations-get (member) ────────────────────────────────────────────
    {
      name: 'reservations-get',
      tags: ['read', 'authenticated', 'member', 'database'],
      method: 'GET',
      readOnly: true,
      expectedStatus: 200,

      buildUrl: (base, data) => `${base}/reservations/${data.reservationId}`,
      buildHeaders: (tokens) => ({ Authorization: `Bearer ${tokens.member}` }),
      buildBody: () => undefined,
    },

    // ── reservations-create (member, write) ──────────────────────────────────
    {
      name: 'reservations-create',
      tags: ['write', 'authenticated', 'member', 'database'],
      method: 'POST',
      readOnly: false,
      expectedStatus: 201,

      buildUrl: (base) => `${base}/reservations`,
      buildHeaders: (tokens) => ({ Authorization: `Bearer ${tokens.member}` }),
      buildBody: (_data) => ({ bookId: _data.bookId2 }),

      beforeIteration: async (prisma, data) => {
        // Cancel/delete any existing reservation for this member+book to avoid conflicts
        await prisma.reservation.updateMany({
          where: {
            userId: data.memberUserId,
            bookId: data.bookId2,
            status: { in: [ReservationStatus.PENDING, ReservationStatus.READY_FOR_PICKUP] },
          },
          data: { status: ReservationStatus.CANCELLED },
        });
      },

      afterIteration: async (prisma, data) => {
        // Cancel the reservation created by this iteration
        if (createState.reservationId) {
          await prisma.reservation.updateMany({
            where: {
              id: createState.reservationId,
              status: ReservationStatus.PENDING,
            },
            data: { status: ReservationStatus.CANCELLED },
          });
          createState.reservationId = null;
        } else {
          // Fallback: cancel all PENDING reservations for this member+book
          await prisma.reservation.updateMany({
            where: {
              userId: data.memberUserId,
              bookId: data.bookId2,
              status: ReservationStatus.PENDING,
            },
            data: { status: ReservationStatus.CANCELLED },
          });
        }
      },

      cleanup: async (prisma, data) => {
        await prisma.reservation.deleteMany({
          where: {
            userId: data.memberUserId,
            bookId: data.bookId2,
          },
        });
      },
    },

    // ── reservations-cancel (member, write) ──────────────────────────────────
    {
      name: 'reservations-cancel',
      tags: ['write', 'authenticated', 'member', 'database'],
      method: 'PATCH',
      readOnly: false,
      expectedStatus: 200,

      buildUrl: (base) => `${base}/reservations/${cancelState.reservationId}/cancel`,
      buildHeaders: (tokens) => ({ Authorization: `Bearer ${tokens.member}` }),
      buildBody: () => undefined,

      beforeIteration: async (prisma, data) => {
        // Create a fresh PENDING reservation to cancel
        const res = await prisma.reservation.create({
          data: {
            userId: data.memberUserId,
            bookId: data.bookId3,
            status: ReservationStatus.PENDING,
          },
          select: { id: true },
        });
        cancelState.reservationId = res.id;
      },

      afterIteration: async (prisma) => {
        // After cancel the status is CANCELLED — delete the record
        if (cancelState.reservationId) {
          await prisma.reservation.deleteMany({
            where: { id: cancelState.reservationId },
          });
          cancelState.reservationId = null;
        }
      },

      cleanup: async (prisma, data) => {
        await prisma.reservation.deleteMany({
          where: { userId: data.memberUserId, bookId: data.bookId3 },
        });
      },
    },
  ],
};
