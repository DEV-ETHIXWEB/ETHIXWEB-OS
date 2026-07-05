// Central permission registry. Every gated action in the app is expressed as
// one of these "module.action" keys instead of a hardcoded company-role
// array — Role documents (backend/src/models/Role.js) grant a subset of
// these per role, and admins can edit that grant set per-organization
// (system roles) or create entirely custom roles, all through the same
// mechanism.
const PERMISSIONS = [
  { key: 'employees.view_sensitive', module: 'Employees', label: 'View salary & bank details' },
  { key: 'employees.manage', module: 'Employees', label: 'Create, edit, delete employees' },
  { key: 'departments.manage', module: 'Departments', label: 'Manage departments' },
  { key: 'teams.manage', module: 'Teams', label: 'Manage teams' },
  { key: 'attendance.view_all', module: 'Attendance', label: "View everyone's attendance" },
  { key: 'attendance.mark_any', module: 'Attendance', label: "Mark attendance for others" },
  { key: 'leaves.approve', module: 'Leave', label: 'Approve or reject leave requests' },
  { key: 'payroll.view_all', module: 'Payroll', label: "View everyone's payslips" },
  { key: 'payroll.manage', module: 'Payroll', label: 'Generate, edit, mark payslips paid' },
  { key: 'payroll.export', module: 'Payroll', label: 'Export payslip PDFs' },
  { key: 'finance.view', module: 'Finance', label: 'View transactions' },
  { key: 'finance.manage', module: 'Finance', label: 'Create, edit, delete transactions' },
  { key: 'finance.export', module: 'Finance', label: 'Export finance reports' },
  { key: 'assets.view', module: 'Assets', label: 'View company assets' },
  { key: 'assets.manage', module: 'Assets', label: 'Manage company assets' },
  { key: 'clients.view', module: 'Clients', label: 'View clients' },
  { key: 'clients.manage', module: 'Clients', label: 'Manage clients' },
  { key: 'domains.view', module: 'Domains', label: 'View domains' },
  { key: 'domains.manage', module: 'Domains', label: 'Manage domains' },
  { key: 'servers.view', module: 'Servers', label: 'View servers' },
  { key: 'servers.manage', module: 'Servers', label: 'Manage servers' },
  { key: 'subscriptions.view', module: 'Subscriptions', label: 'View subscriptions' },
  { key: 'subscriptions.manage', module: 'Subscriptions', label: 'Manage subscriptions' },
  { key: 'vendors.view', module: 'Vendors', label: 'View vendors' },
  { key: 'vendors.manage', module: 'Vendors', label: 'Manage vendors' },
  { key: 'invites.manage', module: 'Team', label: 'Invite and remove teammates' },
  { key: 'roles.manage', module: 'Admin', label: 'Manage roles & permissions' },
  { key: 'organization.manage_settings', module: 'Admin', label: 'Manage organization settings' },
  { key: 'audit_log.view', module: 'Admin', label: 'View the audit log' },
];

const ALL_PERMISSION_KEYS = PERMISSIONS.map((p) => p.key);

// The 10 built-in roles this app has always had. Reproduces exactly the
// access each role has today (see the role-gating audit) so introducing
// this system changes nobody's effective access on its own — an org owner
// can loosen/tighten these per-organization afterward via the Roles admin UI.
const SYSTEM_ROLES = [
  { key: 'superadmin', name: 'Super Admin', permissions: ALL_PERMISSION_KEYS },
  { key: 'owner', name: 'Owner', permissions: ALL_PERMISSION_KEYS },
  {
    key: 'hr',
    name: 'HR',
    permissions: [
      'employees.view_sensitive', 'employees.manage',
      'departments.manage', 'teams.manage',
      'attendance.view_all', 'attendance.mark_any',
      'leaves.approve',
      'assets.view', 'assets.manage',
    ],
  },
  {
    key: 'finance',
    name: 'Finance',
    permissions: [
      'finance.view', 'finance.manage', 'finance.export',
      'payroll.view_all', 'payroll.manage', 'payroll.export',
      'assets.view', 'assets.manage',
      'clients.view', 'clients.manage',
      'domains.view', 'domains.manage',
      'servers.view', 'servers.manage',
      'subscriptions.view', 'subscriptions.manage',
      'vendors.view', 'vendors.manage',
    ],
  },
  {
    key: 'manager',
    name: 'Manager',
    permissions: [
      'assets.view', 'assets.manage',
      'clients.view', 'clients.manage',
      'domains.view',
      'servers.view',
      'subscriptions.view',
      'vendors.view', 'vendors.manage',
      'attendance.view_all', 'attendance.mark_any',
      'leaves.approve',
    ],
  },
  { key: 'developer', name: 'Developer', permissions: [] },
  { key: 'designer', name: 'Designer', permissions: [] },
  { key: 'qa', name: 'QA', permissions: [] },
  { key: 'employee', name: 'Employee', permissions: [] },
  { key: 'viewer', name: 'Viewer', permissions: [] },
];

const DEFAULT_ROLE_PERMISSIONS = SYSTEM_ROLES.reduce((acc, r) => {
  acc[r.key] = r.permissions;
  return acc;
}, {});

module.exports = { PERMISSIONS, ALL_PERMISSION_KEYS, SYSTEM_ROLES, DEFAULT_ROLE_PERMISSIONS };
