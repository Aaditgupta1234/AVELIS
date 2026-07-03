/**
 * @fileoverview String-to-slug conversion utility.
 *
 * Placeholder for future slug generation. Will be used
 * to create URL-friendly slugs from book titles, categories, etc.
 *
 * @module utils/slugify
 *
 * @example
 * // Future usage:
 * // import { slugify } from '../utils/slugify.js';
 * // const slug = slugify('The Great Gatsby'); // 'the-great-gatsby'
 */

/**
 * Convert a string to a URL-friendly slug.
 *
 * @placeholder Basic implementation — may be replaced
 * with a dedicated slugify library later.
 *
 * @param {string} text - The string to slugify
 * @returns {string} URL-friendly slug
 */
export const slugify = (text = '') => {
  // TODO: Enhance with transliteration, special character handling
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')       // Replace spaces with hyphens
    .replace(/[^\w-]+/g, '')    // Remove non-word characters
    .replace(/--+/g, '-')       // Collapse multiple hyphens
    .replace(/^-+/, '')         // Trim leading hyphens
    .replace(/-+$/, '');        // Trim trailing hyphens
};
