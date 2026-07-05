import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

interface RequirePermissionProps {
  /** Any one of these permission keys grants access. */
  anyOf: string[];
  children: React.ReactNode;
}

/** Route-level guard mirroring the server's requirePermission checks, so direct URL access is blocked too, not just the nav link. */
export function RequirePermission({ anyOf, children }: RequirePermissionProps) {
  const { user } = useAuth();
  const granted = !!user?.permissions?.length && anyOf.some((k) => user.permissions!.includes(k));
  if (!granted) return <Navigate to="/app" replace />;
  return <>{children}</>;
}
