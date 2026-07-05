const express = require('express');
const { z } = require('zod');
const Subscription = require('../models/Subscription');
const { requireAuth, requirePermission } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { uploadDocument, uploadToBlob } = require('../middleware/upload');
const { ok, ApiError } = require('../utils/respond');
const { mountCrudExtensions, archivedFilter } = require('../utils/crudExtensions');
const { uploadLimiter } = require('../middleware/rateLimit');

const router = express.Router();
router.use(requireAuth);

router.use(requirePermission('subscriptions.view'));

router.get('/', async (req, res, next) => {
  try {
    const { status, billingCycle, q } = req.query;
    const filter = { organization: req.organizationId, archived: archivedFilter(req) };
    if (status) filter.status = status;
    if (billingCycle) filter.billingCycle = billingCycle;
    if (q) {
      const re = new RegExp(String(q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ vendor: re }, { plan: re }];
    }
    const subscriptions = await Subscription.find(filter).sort({ renewalDate: 1 }).populate('owner', 'name email avatarColor').lean();
    return ok(res, { subscriptions });
  } catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const subscription = await Subscription.findOne({ _id: req.params.id, organization: req.organizationId }).populate('owner', 'name email avatarColor').lean();
    if (!subscription) throw new ApiError('Subscription not found', 404);
    return ok(res, { subscription });
  } catch (e) { next(e); }
});

const bodySchema = z.object({
  vendor: z.string().trim().min(1).max(120),
  plan: z.string().max(120).optional().default(''),
  cost: z.object({ amount: z.number().min(0), currency: z.string().optional().default('USD') }),
  billingCycle: z.enum(['monthly', 'yearly', 'weekly', 'custom']).optional().default('monthly'),
  renewalDate: z.string().datetime(),
  autoRenew: z.boolean().optional().default(true),
  cardUsed: z.string().max(60).optional().default(''),
  owner: z.string().nullable().optional(),
  status: z.enum(['active', 'trial', 'cancelled']).optional().default('active'),
  notes: z.string().max(1000).optional().default(''),
});

router.post('/', requirePermission('subscriptions.manage'), validate(bodySchema), async (req, res, next) => {
  try {
    const subscription = await Subscription.create({ ...req.body, organization: req.organizationId });
    return ok(res, { subscription }, 'Subscription created', 201);
  } catch (e) { next(e); }
});

router.patch('/:id', requirePermission('subscriptions.manage'), validate(bodySchema.partial()), async (req, res, next) => {
  try {
    const subscription = await Subscription.findOneAndUpdate(
      { _id: req.params.id, organization: req.organizationId },
      req.body,
      { new: true }
    );
    if (!subscription) throw new ApiError('Subscription not found', 404);
    return ok(res, { subscription }, 'Subscription updated');
  } catch (e) { next(e); }
});

router.delete('/:id', requirePermission('subscriptions.manage'), async (req, res, next) => {
  try {
    const subscription = await Subscription.findOneAndDelete({ _id: req.params.id, organization: req.organizationId });
    if (!subscription) throw new ApiError('Subscription not found', 404);
    return ok(res, null, 'Subscription deleted');
  } catch (e) { next(e); }
});

router.post('/:id/invoice', uploadLimiter, requirePermission('subscriptions.manage'), uploadDocument.single('invoice'), async (req, res, next) => {
  try {
    const subscription = await Subscription.findOne({ _id: req.params.id, organization: req.organizationId });
    if (!subscription) throw new ApiError('Subscription not found', 404);
    if (!req.file) throw new ApiError('invoice file is required', 400);
    subscription.invoiceUrl = await uploadToBlob(req, req.file, 'invoices');
    await subscription.save();
    return ok(res, { subscription }, 'Invoice uploaded');
  } catch (e) { next(e); }
});

mountCrudExtensions(router, {
  Model: Subscription,
  manageMiddleware: requirePermission('subscriptions.manage'),
  patchSchema: bodySchema.partial(),
  resourceName: 'Subscription',
  beforeDuplicate: async (obj) => {
    obj.vendor = `Copy of ${obj.vendor}`;
    obj.invoiceUrl = '';
    return obj;
  },
});

module.exports = router;
