const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Project = require('../models/Project');
const { ApiError } = require('../utils/respond');

async function requireAuth(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw new ApiError('Authentication required', 401);

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      throw new ApiError('Invalid or expired token', 401);
    }

    const user = await User.findById(payload.sub).lean();
    if (!user) throw new ApiError('User no longer exists', 401);

    req.user = { id: String(user._id), email: user.email, name: user.name };
    next();
  } catch (e) {
    next(e);
  }
}

/**
 * Loads project, ensures the requester is a member.
 * Attaches req.project and req.projectRole ('admin' | 'member').
 * Pass {role: 'admin'} to require admin.
 */
function requireProjectRole(opts = {}) {
  const needAdmin = opts.role === 'admin';
  return async (req, _res, next) => {
    try {
      const projectId = req.params.projectId || req.body.project || req.query.project;
      if (!projectId) throw new ApiError('projectId is required', 400);

      const project = await Project.findById(projectId);
      if (!project) throw new ApiError('Project not found', 404);

      const uid = req.user.id;
      const isOwner = String(project.owner) === uid;
      const member = project.members.find((m) => String(m.user) === uid);
      if (!isOwner && !member) throw new ApiError('You do not have access to this project', 403);

      const role = isOwner ? 'admin' : member.role;
      if (needAdmin && role !== 'admin') {
        throw new ApiError('Admin role required for this action', 403);
      }

      req.project = project;
      req.projectRole = role;
      next();
    } catch (e) {
      next(e);
    }
  };
}

module.exports = { requireAuth, requireProjectRole };
