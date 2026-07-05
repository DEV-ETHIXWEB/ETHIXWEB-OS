import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { rolesApi } from "@/api/roles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { toast } from "sonner";
import { apiErrorMessage } from "@/lib/api";
import type { PermissionDefinition, RoleDefinition } from "@/types";

export default function RolesAdmin() {
  const qc = useQueryClient();
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [deletingRole, setDeletingRole] = useState<RoleDefinition | null>(null);

  const { data: roles = [], isLoading: rolesLoading } = useQuery({ queryKey: ["roles"], queryFn: () => rolesApi.list() });
  const { data: permissions = [] } = useQuery({ queryKey: ["permissions"], queryFn: () => rolesApi.listPermissions() });
  const { data: members = [], isLoading: membersLoading } = useQuery({ queryKey: ["role-members"], queryFn: () => rolesApi.listMembers() });

  const selectedRole = roles.find((r) => r.id === selectedRoleId) ?? roles[0] ?? null;

  const updateMutation = useMutation({
    mutationFn: ({ id, permissions: perms }: { id: string; permissions: string[] }) => rolesApi.update(id, { permissions: perms }),
    onSuccess: (updated) => {
      qc.setQueryData<RoleDefinition[]>(["roles"], (old) => old?.map((r) => (r.id === updated.id ? updated : r)));
    },
    onError: (e) => toast.error(apiErrorMessage(e, "Could not update permissions")),
  });

  const createMutation = useMutation({
    mutationFn: () => rolesApi.create({ name: newRoleName, permissions: [] }),
    onSuccess: (role) => {
      qc.setQueryData<RoleDefinition[]>(["roles"], (old) => (old ? [...old, role] : [role]));
      setSelectedRoleId(role.id);
      setNewRoleName("");
      setCreateOpen(false);
      toast.success("Role created");
    },
    onError: (e) => toast.error(apiErrorMessage(e, "Could not create role")),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => rolesApi.remove(id),
    onSuccess: (_v, id) => {
      qc.setQueryData<RoleDefinition[]>(["roles"], (old) => old?.filter((r) => r.id !== id));
      setDeletingRole(null);
      if (selectedRoleId === id) setSelectedRoleId(null);
      toast.success("Role deleted");
    },
    onError: (e) => toast.error(apiErrorMessage(e, "Could not delete role")),
  });

  const assignMutation = useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string | null }) => rolesApi.assign(userId, roleId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["role-members"] });
      toast.success("Role assigned");
    },
    onError: (e) => toast.error(apiErrorMessage(e, "Could not assign role")),
  });

  const togglePermission = (key: string) => {
    if (!selectedRole) return;
    const has = selectedRole.permissions.includes(key);
    const next = has ? selectedRole.permissions.filter((p) => p !== key) : [...selectedRole.permissions, key];
    updateMutation.mutate({ id: selectedRole.id, permissions: next });
  };

  const grouped = permissions.reduce<Record<string, PermissionDefinition[]>>((acc, p) => {
    (acc[p.module] ??= []).push(p);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Roles &amp; Permissions</h1>
        <p className="text-muted-foreground mt-1">Control exactly what every role in your workspace can see and do.</p>
      </div>

      <Tabs defaultValue="permissions">
        <TabsList>
          <TabsTrigger value="permissions">Permission matrix</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
        </TabsList>

        <TabsContent value="permissions" className="mt-6">
          <div className="grid md:grid-cols-[240px_1fr] gap-6">
            <div className="space-y-2">
              {roles.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedRoleId(r.id)}
                  className={`w-full text-left rounded-xl px-3 py-2.5 text-sm transition-colors flex items-center justify-between gap-2 ${
                    selectedRole?.id === r.id ? "bg-gradient-subtle text-foreground" : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                  }`}
                >
                  <span className="truncate">{r.name}</span>
                  {r.isSystem && <Badge variant="outline" className="text-[0.65rem] shrink-0">System</Badge>}
                </button>
              ))}
              <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full mt-2">
                    <Plus className="h-4 w-4 mr-1.5" /> Custom role
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass-strong border-border/60 max-w-sm">
                  <DialogHeader>
                    <DialogTitle>Create custom role</DialogTitle>
                  </DialogHeader>
                  <div>
                    <Label htmlFor="role-name">Name</Label>
                    <Input
                      id="role-name"
                      value={newRoleName}
                      onChange={(e) => setNewRoleName(e.target.value)}
                      placeholder="Regional Sales Lead"
                      className="mt-1.5"
                      autoFocus
                    />
                  </div>
                  <Button
                    disabled={!newRoleName.trim() || createMutation.isPending}
                    onClick={() => createMutation.mutate()}
                    className="w-full bg-gradient-primary text-primary-foreground"
                  >
                    {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                    Create role
                  </Button>
                </DialogContent>
              </Dialog>
            </div>

            <div className="glass rounded-3xl p-6">
              {!selectedRole ? (
                <div className="text-sm text-muted-foreground">{rolesLoading ? "Loading…" : "Select a role"}</div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-primary-glow" />
                      <div className="font-semibold text-lg">{selectedRole.name}</div>
                      {selectedRole.isSystem && <Badge variant="outline">System role</Badge>}
                    </div>
                    {!selectedRole.isSystem && (
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setDeletingRole(selectedRole)}>
                        <Trash2 className="h-4 w-4 mr-1.5" /> Delete
                      </Button>
                    )}
                  </div>

                  <div className="space-y-6">
                    {Object.entries(grouped).map(([module, perms]) => (
                      <div key={module}>
                        <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">{module}</div>
                        <div className="grid sm:grid-cols-2 gap-2">
                          {perms.map((p) => (
                            <label key={p.key} className="flex items-center gap-2.5 text-sm rounded-lg px-3 py-2 hover:bg-secondary/40 cursor-pointer">
                              <Checkbox
                                checked={selectedRole.permissions.includes(p.key)}
                                onCheckedChange={() => togglePermission(p.key)}
                                disabled={updateMutation.isPending}
                              />
                              {p.label}
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="members" className="mt-6">
          <div className="glass rounded-3xl p-6">
            {membersLoading ? (
              <div className="text-sm text-muted-foreground">Loading…</div>
            ) : (
              <div className="space-y-2">
                {members.map((m) => (
                  <div key={m.id} className="flex items-center gap-4 rounded-xl border border-border/60 px-4 py-3 flex-wrap">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{m.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{m.email} &middot; default: {m.companyRole}</div>
                    </div>
                    <Select
                      value={m.role?.id ?? "__default__"}
                      onValueChange={(v) => assignMutation.mutate({ userId: m.id, roleId: v === "__default__" ? null : v })}
                    >
                      <SelectTrigger className="w-56 bg-secondary/40 border-border/60">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__default__">Default ({m.companyRole})</SelectItem>
                        {roles.map((r) => (
                          <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={!!deletingRole}
        onOpenChange={(v) => !v && setDeletingRole(null)}
        title={`Delete "${deletingRole?.name}"?`}
        description="You must move every member off this role before it can be deleted. This cannot be undone."
        confirmLabel="Delete"
        isPending={deleteMutation.isPending}
        onConfirm={() => deletingRole && deleteMutation.mutate(deletingRole.id)}
      />
    </div>
  );
}
