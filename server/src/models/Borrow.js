/**
 * @fileoverview Borrow model.
 *
 * Placeholder for the Mongoose Borrow schema and model.
 * Tracks book borrowing transactions.
 *
 * @module models/Borrow
 *
 * Future schema fields:
 * - user          {ObjectId} — Reference to borrowing User
 * - book          {ObjectId} — Reference to borrowed Book
 * - borrowDate    {Date}     — Date the book was borrowed
 * - dueDate       {Date}     — Expected return date
 * - returnDate    {Date}     — Actual return date (null if not returned)
 * - status        {String}   — borrowed, returned, overdue
 * - fine          {Number}   — Late return fine amount
 * - createdAt     {Date}     — Auto-generated timestamp
 * - updatedAt     {Date}     — Auto-generated timestamp
 */

// TODO: Define Mongoose schema and export model
// import mongoose from 'mongoose';
// const borrowSchema = new mongoose.Schema({ ... }, { timestamps: true });
// export default mongoose.model('Borrow', borrowSchema);
