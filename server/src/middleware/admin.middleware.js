/**
 * @fileoverview Deprecated admin middleware wrapper.
 *
 * Delegates role-based restriction to the centralized authorization middleware.
 * Exposes a fallback interface to preserve backward-compatibility with routes.
 *
 * @module middleware/admin.middleware
 */

import { requireRole } from './authorization.middleware.js';
import { ROLES } from '../config/index.js';

export const adminMiddleware = requireRole(ROLES.ADMIN);
export default adminMiddleware;
