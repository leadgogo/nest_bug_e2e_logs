import { Injectable } from '@nestjs/common';
import { FeaturesService } from 'src/application/authorization/authorization-providers/features/features.service';
import { PermissionsService } from 'src/application/authorization/authorization-providers/permissions/permissions.service';
import { SessionService } from 'src/application/session/session.service';

@Injectable()
export class AuthorizationService {
  constructor(
    private sessionService: SessionService,
    private permissionsService: PermissionsService,
    private featuresAuthorizationService: FeaturesService
  ) {}

  async requirePermissionsForInstitution(
    institutionId: number,
    requiredPermissions: string[]
  ) {
    await this.permissionsService.requirePermissionsForInstitution(
      await this.sessionService.getCurrentUser(),
      institutionId,
      requiredPermissions
    );
  }

  async requirePermissionsForDefaultInstitution(requiredPermissions: string[]) {
    await this.requirePermissionsForInstitution(
      (await this.sessionService.getCurrentUser()).institutionId,
      requiredPermissions
    );
  }

  async requireFeatureForInstitution(
    institutionId: number,
    featureName: string
  ) {
    await this.featuresAuthorizationService.requireFeatureForInstitution(
      institutionId,
      featureName
    );
  }

  async getFeaturesForInstitution(institutionId: number) {
    return this.featuresAuthorizationService.getFeaturesForInstitution(
      institutionId
    );
  }
}
