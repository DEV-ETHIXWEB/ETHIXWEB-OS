import { api } from "@/lib/api";
import { normRole } from "./normalize";
import type { CompanyRole, PermissionDefinition, RoleDefinition } from "@/types";

export interface OrgMember {
  id: string;
  name: string;
  email: string;
  companyRole: CompanyRole;
  role: { id: string; name: string } | null;
}

export const rolesApi = {
  async listPermissions(): Promise<PermissionDefinition[]> {
    const { data } = await api.get("/roles/permissions");
    return data.permissions ?? [];
  },
  async list(): Promise<RoleDefinition[]> {
    const { data } = await api.get("/roles");
    return (data.roles ?? []).map(normRole);
  },
  async listMembers(): Promise<OrgMember[]> {
    const { data } = await api.get("/roles/members");
    return (data.members ?? []).map((m: { _id: string; name: string; email: string; companyRole: CompanyRole; role: { _id: string; name: string } | null }) => ({
      id: m._id,
      name: m.name,
      email: m.email,
      companyRole: m.companyRole,
      role: m.role ? { id: m.role._id, name: m.role.name } : null,
    }));
  },
  async create(input: { name: string; description?: string; permissions: string[] }): Promise<RoleDefinition> {
    const { data } = await api.post("/roles", input);
    return normRole(data.role);
  },
  async update(id: string, input: { name?: string; description?: string; permissions?: string[] }): Promise<RoleDefinition> {
    const { data } = await api.patch(`/roles/${id}`, input);
    return normRole(data.role);
  },
  async remove(id: string): Promise<void> {
    await api.delete(`/roles/${id}`);
  },
  async assign(userId: string, roleId: string | null): Promise<void> {
    await api.patch(`/roles/assign/${userId}`, { roleId });
  },
};
