import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const { user } = context.switchToHttp().getRequest();

        // ── Check required ROLES ─────────────────────────────────────────────
        const requiredRoles = this.reflector.getAllAndOverride<string[]>(
            ROLES_KEY,
            [context.getHandler(), context.getClass()],
        );

        // ── Check required PERMISSIONS ───────────────────────────────────────
        const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
            PERMISSIONS_KEY,
            [context.getHandler(), context.getClass()],
        );

        // No restrictions defined → allow
        if (!requiredRoles && !requiredPermissions) return true;

        // User must be authenticated
        if (!user) {
            throw new ForbiddenException('You do not have permission to access this resource.');
        }

        const userRoles: string[] = Array.isArray(user.roles) ? user.roles : [];
        const userPermissions: string[] = Array.isArray(user.permissions) ? user.permissions : [];

        // superadmin bypasses all checks
        if (userRoles.includes('superadmin')) return true;

        // Check ROLES (OR logic - any matching role is enough)
        if (requiredRoles && requiredRoles.length > 0) {
            const hasRole = requiredRoles.some((r) => userRoles.includes(r));
            if (!hasRole) {
                throw new ForbiddenException('Insufficient role to access this resource.');
            }
        }

        // Check PERMISSIONS (OR logic - any matching permission is enough)
        if (requiredPermissions && requiredPermissions.length > 0) {
            const hasPermission = requiredPermissions.some((p) => userPermissions.includes(p));
            if (!hasPermission) {
                throw new ForbiddenException('Insufficient permissions to access this resource.');
            }
        }

        return true;
    }
}
