const express = require('express');
const { z } = require('zod');
const Server = require('../models/Server');
const { requireAuth, requirePermission } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { ok, ApiError } = require('../utils/respond');
const { mountCrudExtensions, archivedFilter } = require('../utils/crudExtensions');

const router = express.Router();
router.use(requireAuth);

router.use(requirePermission('servers.view'));

router.get('/', async (req, res, next) => {
  try {
    const { status, provider, q } = req.query;
    const filter = { organization: req.organizationId, archived: archivedFilter(req) };
    if (status) filter.status = status;
    if (provider) filter.provider = provider;
    if (q) {
      const re = new RegExp(String(q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.label = re;
    }
    const servers = await Server.find(filter).sort({ renewalDate: 1 }).lean();
    return ok(res, { servers });
  } catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const server = await Server.findOne({ _id: req.params.id, organization: req.organizationId }).lean();
    if (!server) throw new ApiError('Server not found', 404);
    return ok(res, { server });
  } catch (e) { next(e); }
});

const usageSchema = z.object({ used: z.number().min(0).optional(), total: z.number().min(0).optional(), unit: z.string().optional() });

const bodySchema = z.object({
  label: z.string().trim().min(1).max(120),
  provider: z.enum(['Railway', 'Vercel', 'Render', 'AWS', 'Azure', 'GCP', 'DigitalOcean', 'VPS', 'Other']),
  hostingType: z.string().max(80).optional().default(''),
  storage: usageSchema.optional(),
  bandwidth: usageSchema.optional(),
  cost: z.object({ amount: z.number().min(0), currency: z.string().optional().default('USD') }),
  renewalDate: z.string().datetime(),
  status: z.enum(['online', 'offline', 'degraded']).optional().default('online'),
  notes: z.string().max(1000).optional().default(''),
});

router.post('/', requirePermission('servers.manage'), validate(bodySchema), async (req, res, next) => {
  try {
    const server = await Server.create({ ...req.body, organization: req.organizationId });
    return ok(res, { server }, 'Server created', 201);
  } catch (e) { next(e); }
});

router.patch('/:id', requirePermission('servers.manage'), validate(bodySchema.partial()), async (req, res, next) => {
  try {
    const patch = { ...req.body };
    if ('status' in patch) patch.lastCheckedAt = new Date();
    const server = await Server.findOneAndUpdate(
      { _id: req.params.id, organization: req.organizationId },
      patch,
      { new: true }
    );
    if (!server) throw new ApiError('Server not found', 404);
    return ok(res, { server }, 'Server updated');
  } catch (e) { next(e); }
});

router.delete('/:id', requirePermission('servers.manage'), async (req, res, next) => {
  try {
    const server = await Server.findOneAndDelete({ _id: req.params.id, organization: req.organizationId });
    if (!server) throw new ApiError('Server not found', 404);
    return ok(res, null, 'Server deleted');
  } catch (e) { next(e); }
});

mountCrudExtensions(router, {
  Model: Server,
  manageMiddleware: requirePermission('servers.manage'),
  patchSchema: bodySchema.partial(),
  resourceName: 'Server',
  beforeDuplicate: async (obj) => {
    obj.label = `Copy of ${obj.label}`;
    return obj;
  },
});

module.exports = router;
