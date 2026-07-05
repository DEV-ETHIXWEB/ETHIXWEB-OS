const express = require('express');
const { z } = require('zod');
const Role = require('../models/Role');
const User = require('../models/User');
const { PERMISSIONS, ALL_PERMISSION_KEYS, SYSTEM_ROLES } = require('../config/permissions');
const { requireAuth, requirePermission } = require('../middleware/auth');
const { validate, idParamSchema } = require('../middleware/validate');
const { ok, ApiError } = require('../utils/respond');
const { logAudit } = require('../utils/audit');

const router = express.Router();
router.use(requireAuth);
router.use(requirePermission('roles.manage'));

// Materializes the 10 system roles as real Role documents for this org the
// first time anyone asks — before that, they exist only as the hardcoded
// SYSTEM_ROLES defaults (see config/permissions.js), which is all most orgs
// will ever need. Seeding them lazily means no migration script has to run
// against every existing organization.
async function ensureSystemRoles(organizationId) {
  const existing = await Role.find({ organization: organizationId, isSystem: true }).select('key').lean();
  const existingKeys = new Set(existing.map((r) => r.key));
  const missing = SYSTEM_ROLES.filter((r) => !existingKeys.has(r.key));
  if (missing.length) {
    await Role.insertMany(
      missing.map((r) => ({
        organization: organizationId,
        key: r.key,
        name: r.name,
        isSystem: true,
        permissions: r.permissions,
      })),
      { ordered: false }
    ).catch(() => {}); // ignore duplicate-key races from concurrent requests
  }
}

router.get('/permissions', async (_req, res, next) => {
  try {
    return ok(res, { permissions: PERMISSIONS });
  } catch (e) { next(e); }
});

router.get('/', async (req, res, next) => {
  try {
    await ensureSystemRoles(req.organizationId);
    const roles = await Role.find({ organization: req.organizationId }).sort({ isSystem: -1, name: 1 }).lean();
    return ok(res, { roles });
  } catch (e) { next(e); }
});

router.get('/members', async (req, res, next) => {
  try {
    const users = await User.find({ organization: req.organizationId })
      .select('name email companyRole role')
      .populate('role', 'name')
      .lean();
    return ok(res, { members: users });
  } catch (e) { next(e); }
});

const permissionsArraySchema = z.array(z.enum(ALL_PERMISSION_KEYS)).default([]);

const createSchema = z.object({
  name: z.string().trim().min(2).max(60),
  description: z.string().trim().max(300).optional().default(''),
  permissions: permissionsArraySchema,
});

router.post('/', validate(createSchema), async (req, res, next) => {
  try {
    const key = req.body.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
    if (!key) throw new ApiError('Role name must contain at least one letter or number', 400);
    const existing = await Role.findOne({ organization: req.organizationId, key });
    if (existing) throw new ApiError('A role with this name already exists', 409);

    const role = await Role.create({
      organization: req.organizationId,
      key,
      name: req.body.name,
      description: req.body.description,
      isSystem: false,
      permissions: req.body.permissions,
    });
    await logAudit(req, 'role.create', 'Role', role._id, { name: role.name });
    return ok(res, { role }, 'Role created', 201);
  } catch (e) { next(e); }
});

const updateSchema = z.object({
  name: z.string().trim().min(2).max(60).optional(),
  description: z.string().trim().max(300).optional(),
  permissions: permissionsArraySchema.optional(),
});

router.patch('/:id', validate(idParamSchema, 'params'), validate(updateSchema), async (req, res, next) => {
  try {
    const role = await Role.findOne({ _id: req.params.id, organization: req.organizationId });
    if (!role) throw new ApiError('Role not found', 404);
    // System roles keep their key/name (so DEFAULT_ROLE_PERMISSIONS lookups
    // by companyRole stay meaningful) — only their permission grant is editable.
    if (role.isSystem) {
      if (req.body.permissions) role.permissions = req.body.permissions;
    } else {
      Object.assign(role, req.body);
    }
    await role.save();
    await logAudit(req, 'role.update', 'Role', role._id, { name: role.name, permissions: role.permissions });
    return ok(res, { role }, 'Role updated');
  } catch (e) { next(e); }
});

router.delete('/:id', validate(idParamSchema, 'params'), async (req, res, next) => {
  try {
    const role = await Role.findOne({ _id: req.params.id, organization: req.organizationId });
    if (!role) throw new ApiError('Role not found', 404);
    if (role.isSystem) throw new ApiError('System roles cannot be deleted', 400);
    const inUse = await User.countDocuments({ role: role._id });
    if (inUse > 0) throw new ApiError(`${inUse} member(s) still have this role assigned`, 400);
    await Role.deleteOne({ _id: role._id });
    await logAudit(req, 'role.delete', 'Role', role._id, { name: role.name });
    return ok(res, null, 'Role deleted');
  } catch (e) { next(e); }
});

const assignSchema = z.object({ roleId: z.string().regex(/^[0-9a-fA-F]{24}$/).nullable() });

router.patch('/assign/:userId', validate(assignSchema), async (req, res, next) => {
  try {
    if (!/^[0-9a-fA-F]{24}$/.test(req.params.userId)) throw new ApiError('User not found', 404);
    const user = await User.findOne({ _id: req.params.userId, organization: req.organizationId });
    if (!user) throw new ApiError('User not found', 404);

    if (req.body.roleId) {
      const role = await Role.findOne({ _id: req.body.roleId, organization: req.organizationId });
      if (!role) throw new ApiError('Role not found', 404);
      user.role = role._id;
    } else {
      user.role = null; // falls back to companyRole-derived permissions
    }
    await user.save();
    await logAudit(req, 'user.role_assign', 'User', user._id, { roleId: req.body.roleId });
    return ok(res, null, 'Role assigned');
  } catch (e) { next(e); }
});

module.exports = router;
