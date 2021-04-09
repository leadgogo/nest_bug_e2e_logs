import { EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import { from } from 'linq';
import { virtualToReal } from 'src/infrastructure/database/base.repository';
import { ContactStage } from './contact-stage.entity';
import { ContactStatus } from './contact-status/contact-status.entity';

@Injectable()
export class ContactStageService {
  constructor(
    @InjectRepository(ContactStage)
    private contactStageRepository: EntityRepository<ContactStage>,
    @InjectRepository(ContactStatus)
    private contactStatusRepository: EntityRepository<ContactStatus>
  ) {}

  async getAll(fields: string[]) {
    return this.contactStageRepository.findAll({
      fields: virtualToReal(ContactStage, fields),
    });
  }

  async getStatusesByStage(fields: string[], contactStageIds: number[]) {
    const statuses = await this.contactStatusRepository.find(
      { stage: contactStageIds },
      { fields: virtualToReal(ContactStatus, [...fields, 'stage_id']) }
    );
    const grouped = Object.fromEntries(
      from(statuses)
        .groupBy((status) => status.stage.id)
        .select(
          (g) => [g.key().toString(), g.toArray()] as [string, ContactStatus[]]
        )
        .toArray()
    );
    return grouped;
  }
}
