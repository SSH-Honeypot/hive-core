import {
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { FrontendGateway } from '../frontend/frontend.gateway';
import { InjectRepository } from '@nestjs/typeorm';
import { Session } from '../../entities/session.entity';
import { Repository } from 'typeorm';
import { LoginAttempt } from '../../entities/login-attempt.entity';

import * as geoip from 'geoip-country';

@WebSocketGateway(3002, {
  cors: {
    origin: '*',
  },
})
export class CowrieGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(CowrieGateway.name);

  constructor(
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
    @InjectRepository(LoginAttempt)
    private readonly loginAttemptRepository: Repository<LoginAttempt>,
    private readonly frontendGateway: FrontendGateway,
  ) {}

  handleConnection(@ConnectedSocket() client: Socket) {
    this.logger.log(
      `Sensor connected: ${client.handshake.auth.sensor} [${client.id}]`,
    );
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {
    this.logger.log(
      `Sensor disconnected: ${client.handshake.auth.sensor} [${client.id}]`,
    );
  }

  @SubscribeMessage('cowrie.login.failed')
  async handleMessage(
    client: Socket,
    payload: {
      sensor: string;
      session: string;
      src_ip: string;
      username: string;
      password: string;
    },
  ): Promise<void> {
    this.logger.debug(
      `${client.handshake.auth.sensor} [${client.id}]: ` +
        JSON.stringify(payload),
    );

    const countryCode: string = geoip.lookup(payload.src_ip)?.country ?? '';

    let session = await this.sessionRepository.findOneBy({
      uuid: payload.session,
    });

    if (!session) {
      session = new Session();
      session.uuid = payload.session;
      session.ip = payload.src_ip;
      session.country = countryCode;
      session.sensor = payload.sensor;
      session = await this.sessionRepository.save(session);
    }

    const loginAttempt = new LoginAttempt();
    loginAttempt.session = session;
    loginAttempt.username = payload.username;
    loginAttempt.password = payload.password;
    await this.loginAttemptRepository.insert(loginAttempt);

    this.frontendGateway.onCowrieLoginEvent({
      date: new Date(),
      session: payload.session,
      sensor: payload.sensor,
      src_ip: this.anonymizeIPv4(payload.src_ip),
      country: countryCode,
      username: payload.username,
      password: payload.password,
    });
  }

  private anonymizeIPv4(ip: string): string {
    const ipv4Pattern = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    if (!ipv4Pattern.test(ip)) {
      throw new Error('Invalid IPv4 address!');
    }

    const parts = ip.split('.');

    const thirdOctet = 'X'.repeat(parts[2].length);
    const fourthOctet = 'X'.repeat(parts[3].length);

    return `${parts[0]}.${parts[1]}.${thirdOctet}.${fourthOctet}`;
  }
}
