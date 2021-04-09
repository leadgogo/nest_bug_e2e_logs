import { Controller, Post, Body, HttpCode, Get } from '@nestjs/common';
import {
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { LoginDTO } from './dtos/login.dto';
import { TokenDTO } from './dtos/token.dto';
import { SessionService } from './session.service';

@Controller('auth')
export class SessionController {
  constructor(private sessionService: SessionService) {}

  @ApiUnauthorizedResponse()
  @ApiOkResponse({ type: TokenDTO })
  @ApiOperation({ summary: 'Log in' })
  @Post('login')
  @HttpCode(200)
  async login(@Body() { username, password }: LoginDTO): Promise<TokenDTO> {
    const token = await this.sessionService.login(username, password);
    return { token };
  }

  @ApiHeader({
    name: 'authorization',
    description: 'Bearer Token with JWT',
  })
  @ApiUnauthorizedResponse()
  @ApiOkResponse()
  @ApiOperation({ summary: 'Log out' })
  @Get('logout')
  async logout(): Promise<void> {
    await this.sessionService.logout();
  }
}
