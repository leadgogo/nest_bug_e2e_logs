import { ApiProperty } from '@nestjs/swagger';

export abstract class TokenDTO {
  @ApiProperty({ description: 'JWT' })
  token: string;
}
