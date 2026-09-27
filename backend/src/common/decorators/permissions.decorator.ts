import { SetMetadata } from '@nestjs/common';
import { PermissionSlug } from '../constants/roles.constants';

export const PERMISSIONS_KEY = 'permissions';

export const Permissions = (...permissions: PermissionSlug[]) =>
    SetMetadata(PERMISSIONS_KEY, permissions);
