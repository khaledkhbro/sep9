/**
 * Admin Panel v0 – User Roles & Permissions
 *
 * Overview:
 * - Allows creation of multiple admins with different access levels.
 * - Roles:
 *    1. SUPER_ADMIN  → Full access to all settings and features.
 *    2. MANAGER      → Limited access (e.g., manage users, view reports).
 *    3. SUPPORT      → Only access to chat/support features.
 *
 * Implementation:
 * 1. Add a 'role' column in the admins table:
 *    ALTER TABLE admins ADD COLUMN role VARCHAR(50) DEFAULT 'support';
 *
 * 2. Assign role when creating an admin:
 *    INSERT INTO admins (username, password, role) VALUES ('john', 'hashed_password', 'super_admin');
 *
 * 3. Middleware to protect API routes by role:
 *    function authorizeAdmin(requiredRole) {
 *       return (req, res, next) => {
 *          const admin = req.admin; // get from auth/session
 *          if (!admin || admin.role !== requiredRole) return res.status(403).json({ message: "Access denied" });
 *          next();
 *       };
 *    }
 *
 * Usage:
 *    app.get("/api/admin/settings", authorizeAdmin("super_admin"), (req, res) => {
 *       res.json({ message: "Settings loaded" });
 *    });
 *
 * Notes:
 * - SUPER_ADMIN can create/edit other admins.
 * - Roles can be extended later with granular permissions array.
 *
 * Version: v0
 */
