import {
  UseGuards,
  OnModuleInit,
  OnModuleDestroy,
  Inject,
} from '@nestjs/common';
import {
  WebSocketGateway,
  SubscribeMessage,
  OnGatewayConnection,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import Redis from 'ioredis';
import { WsJwtGuard } from './guard';
import { authenticateWsClient } from './auth/ws.auth';
import { ConfigService } from '@nestjs/config';

@UseGuards(WsJwtGuard)
@WebSocketGateway({
  cors: { origin: '*' }, // allow connections from any origin (adjust for production)
})
export class EventsGateway
  implements OnGatewayConnection, OnModuleInit, OnModuleDestroy
{
  constructor(
    private configService: ConfigService,
    @Inject('REDIS_CLIENT') private readonly redisClient: Redis,
  ) {}

  @WebSocketServer()
  server: Server;

  // Redis subscriber client
  private redisSubscriber: Redis;

  async onModuleInit() {
    this.redisSubscriber = new Redis(); // Connect to default Redis (adjust config if needed)

    // Subscribe to all channels matching events:*
    const sub = this.redisClient.duplicate();

    sub.psubscribe(`events:*`, (err, count) => {
      if (err) {
        console.error('Failed to subscribe to Redis channels:', err);
      } else {
        console.log(`Subscribed to ${count} Redis channels`);
      }
    });

    // Listen for incoming messages on those channels
    sub.on('pmessage', (pattern, channel, message) => {
      // channel format: events:<websiteId>
      const websiteId = channel.split(':')[1];

      try {
        const event = JSON.parse(message);
        // Emit the event to all clients in the website room
        this.server.to(`website-${websiteId}`).emit('new_event', event);
      } catch (error) {
        console.error('Failed to parse event message:', error);
      }
    });
  }

  async onModuleDestroy() {
    await this.redisSubscriber.quit();
  }

  async handleConnection(client: Socket) {
    const websiteId = client.handshake.query.websiteId as string;
    const token = client.handshake.query.token as string;

    const decoded = await authenticateWsClient(token, this.configService);

    if (!decoded) {
      console.warn(`Client ${client.id} did not provide a valid token`);
      client.disconnect(true);
      return;
    }

    // Validate websiteId presence and format (optional, recommended)
    if (typeof websiteId !== 'string' || websiteId.trim() === '') {
      console.warn(`Client ${client.id} did not provide a valid websiteId`);
      client.disconnect(true);
      return;
    }

    // Join the client to a room for the website they want to watch
    client.join(`website-${websiteId}`);

    console.log(
      `Client ${client.id} connected (user ${decoded.sub}), joined room: website-${websiteId}`,
    );
  }

  // @SubscribeMessage('hello')
  // handleMessage(client: Socket, payload: any): string {
  //   return 'Hello client!';
  // }
}
