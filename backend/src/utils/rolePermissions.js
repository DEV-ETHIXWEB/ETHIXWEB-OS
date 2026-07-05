const Role = require('../models/Role');
const { DEFAULT_ROLE_PERMISSIONS } = require('../config/permissions');

// Resolution order:
//   1. An explicit custom/system Role assignment on the user (`user.role`).
//   2. An org-level customization of that companyRole's system Role — an
//      owner edited "HR" via the Roles admin UI for this org specifically.
//   3. The global default for that companyRole (unmodified since this
//      system shipped) — this is what every pre-existing user resolves to,
//      so introducing Role documents changes nobody's access on its own.
async function resolvePermissions({ organizationId, companyRole, role }) {
  if (role && Array.isArray(role.permissions)) return role.permissions;

  const orgRole = await Role.findOne({ organization: organizationId, key: companyRole }).select('permissions').lean();
  if (orgRole) return orgRole.permissions;

  return DEFAULT_ROLE_PERMISSIONS[companyRole] || [];
}

module.exports = { resolvePermissions };
