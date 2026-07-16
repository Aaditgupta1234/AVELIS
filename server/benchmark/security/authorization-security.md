# AVELIS Authorization Security Architecture Documentation

This document describes the role-based access control (RBAC), hierarchy boundaries, ownership validation rules, and error handling policies implemented in Phase 13.6.3 for the AVELIS backend.

---

## 1. Environment differences Matrix

| Security Control | Development Mode | Production Mode |
| --- | :---: | :---: |
| **RBAC Enforcement** | ✓ Enforced | ✓ Enforced |
| **Hierarchical Access Checks** | ✓ Enforced (`requireRole`) | ✓ Enforced (`requireRole`) |
| **Direct Route Parameter Access** | ✓ Blocked (Ownership check) | ✓ Blocked (Ownership check) |
| **Standardized 403 Response** | ✓ Enforced | ✓ Enforced |
| **Deep-Freeze Config Immutability** | ✓ Enforced | ✓ Enforced |
| **Future Role Support** | ✓ Enabled | ✓ Enabled |

---

## 2. RBAC Model & Hierarchical Access Control

AVELIS implements a hierarchical role ranking schema defined in [authorization.config.js](file:///f:/Vscode/Anveli/server/src/config/authorization.config.js):
1. **`MEMBER` (Level 1)**: Basic library user. Can borrow, reserve, and review books.
2. **`STAFF` (Level 2)**: Library staff member. Future utility placeholder.
3. **`ADMIN` (Level 3)**: Library administrator. Can view all loans, force return syncing, and override member permissions.
4. **`SUPER_ADMIN` (Level 4)**: Ultimate system control role.

### Middleware Enforcements
- **`requireRole(minRole)`**: Employs hierarchical checks. Users holding a role with equal or greater ranking can access the endpoint (e.g. `SUPER_ADMIN` passes a `requireRole(ROLES.ADMIN)` check).
- **`requireExactRole(role)`**: Enforces strict string match.
- **`requireAnyRole(...roles)`**: Requires user's role to match at least one string in the list.

---

## 3. Ownership Validation Policies

Access to member-specific resources is validated using `canAccessResource(user, resourceOwnerId)` from [authorization.js](file:///f:/Vscode/Anveli/server/src/utils/authorization.js):
* **Admin Privilege (Level 3 or higher)**: Always granted access to bypass individual ownership validations for oversight/operations.
* **Owner Matching**: Granted if the decoded `id` from the request's JWT equals the resource's `userId`.
* **Everyone else**: Rejected immediately.

Ownership validations never trust route parameters supplied in the request body or path. They are evaluated against the securely authenticated JWT token identity.

---

## 4. Consistent HTTP 403 Forbidden Responses

All authorization failures (mismatched roles, failed ownership validation, unknown permissions) return the exact same standardized response payload to prevent metadata/schema information leakage:
- **Status**: `403 Forbidden`
- **Body**:
  ```json
  {
    "success": false,
    "message": "You do not have permission to perform this action."
  }
  ```
No database primary keys, role configurations, configuration levels, or stack traces are disclosed.
