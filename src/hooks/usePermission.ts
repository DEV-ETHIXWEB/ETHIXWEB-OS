import { useAuth } from "@/context/AuthContext";

export function useHasPermission(key: string): boolean {
  const { user } = useAuth();
  return !!user?.permissions?.includes(key);
}

export function useHasAnyPermission(keys: string[]): boolean {
  const { user } = useAuth();
  if (!user?.permissions?.length) return false;
  return keys.some((k) => user.permissions!.includes(k));
}
