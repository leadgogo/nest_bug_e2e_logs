import { Global, Module } from '@nestjs/common';
import { PermissionsModule } from 'src/application/authorization/authorization-providers/permissions/permissions.module';
import { FeaturesModule } from 'src/application/authorization/authorization-providers/features/features.module';
import { AuthorizationService } from 'src/application/authorization/authorization.service';

@Global()
@Module({
  imports: [PermissionsModule, FeaturesModule],
  providers: [AuthorizationService],
  exports: [AuthorizationService],
})
export class AuthorizationModule {}
