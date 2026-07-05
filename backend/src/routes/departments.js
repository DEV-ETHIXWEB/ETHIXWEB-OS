const express = require('express');
const { z } = require('zod');
const Department = require('../models/Department');
const { requireAuth, requirePermission } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { ok, ApiError } = require('../utils/respond');
const { mountCrudExtensions, archivedFilter } = require('../utils/crudExtensions');

const router = express.Router();
router.use(requireAuth);

// Read: any authenticated user (org structure is org-wide directory info, like Employees).
router.get('/', async (req, res, next) => {
  try {
    const departments = await Department.find({ organization: req.organizationId, archived: archivedFilter(req) })
      .sort({ name: 1 })
      .populate('manager', 'name employeeId photoUrl')
      .lean();
    return ok(res, { departments });
  } catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const department = await Department.findOne({ _id: req.params.id, organization: req.organizationId }).populate('manager', 'name employeeId photoUrl').lean();
    if (!department) throw new ApiError('Department not found', 404);
    return ok(res, { department });
  } catch (e) { next(e); }
});

const bodySchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().max(500).optional().default(''),
  manager: z.string().nullable().optional(),
  color: z.string().regex(/^#?[0-9a-fA-F]{6}$/, 'Invalid color').optional(),
});

router.post('/', requirePermission('departments.manage'), validate(bodySchema), async (req, res, next) => {
  try {
    const department = await Department.create({ ...req.body, organization: req.organizationId });
    const populated = await Department.findById(department._id).populate('manager', 'name employeeId photoUrl').lean();
    return ok(res, { department: populated }, 'Department created', 201);
  } catch (e) { next(e); }
});

router.patch('/:id', requirePermission('departments.manage'), validate(bodySchema.partial()), async (req, res, next) => {
  try {
    const department = await Department.findOneAndUpdate(
      { _id: req.params.id, organization: req.organizationId },
      req.body,
      { new: true }
    ).populate('manager', 'name employeeId photoUrl');
    if (!department) throw new ApiError('Department not found', 404);
    return ok(res, { department }, 'Department updated');
  } catch (e) { next(e); }
});

router.delete('/:id', requirePermission('departments.manage'), async (req, res, next) => {
  try {
    const department = await Department.findOneAndDelete({ _id: req.params.id, organization: req.organizationId });
    if (!department) throw new ApiError('Department not found', 404);
    return ok(res, null, 'Department deleted');
  } catch (e) { next(e); }
});

mountCrudExtensions(router, {
  Model: Department,
  manageMiddleware: requirePermission('departments.manage'),
  patchSchema: bodySchema.partial(),
  resourceName: 'Department',
  beforeDuplicate: async (obj, attempt) => {
    obj.name = attempt === 0 ? `Copy of ${obj.name}` : `Copy of ${obj.name} (${attempt + 1})`;
    return obj;
  },
});

module.exports = router;
