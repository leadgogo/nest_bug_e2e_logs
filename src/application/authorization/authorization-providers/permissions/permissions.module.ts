import { Module } from '@nestjs/common';
import { PermissionTreeService } from './permission-tree.service';
import { PermissionsService } from './permissions.service';

@Module({
  providers: [PermissionTreeService, PermissionsService],
  exports: [PermissionsService],
})
export class PermissionsModule {}
