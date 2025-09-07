import {
  ConnectedSocket,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { LoginEvent } from '../../types/login-event';

@WebSocketGateway(3001, {
  cors: {
    origin: '*', // ToDo: make prod ready
  },
})
export class FrontendGateway {
  @WebSocketServer() server: Server;

  lastLogs: LoginEvent[] = [];

  handleConnection(@ConnectedSocket() client: Socket) {
    client.emit('initial-data', this.lastLogs);
  }

  public onCowrieLoginEvent(event: LoginEvent): void {
    this.lastLogs.push(event);
    if (this.lastLogs.length > 30) this.lastLogs.shift();
    this.server.emit('login.failed', event);
  }
}
