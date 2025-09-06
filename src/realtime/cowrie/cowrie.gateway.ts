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
    this.frontendGateway.server.emit('login.failed', payload);

    let session = await this.sessionRepository.findOneBy({
      uuid: payload.session,
    });

    if (!session) {
      session = new Session();
      session.uuid = payload.session;
      session.ip = payload.src_ip;
      session.sensor = payload.sensor;
      session = await this.sessionRepository.save(session);
    }

    const loginAttempt = new LoginAttempt();
    loginAttempt.session = session;
    loginAttempt.username = payload.username;
    loginAttempt.password = payload.password;
    await this.loginAttemptRepository.insert(loginAttempt);
  }
}
