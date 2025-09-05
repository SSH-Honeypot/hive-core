import { Module } from '@nestjs/common';
import { CowrieGateway } from './cowrie/cowrie.gateway';
import { FrontendGateway } from './frontend/frontend.gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoginAttempt } from '../entities/login-attempt.entity';
import { Session } from '../entities/session.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Session, LoginAttempt])],
  providers: [CowrieGateway, FrontendGateway],
})
export class RealtimeModule {}
