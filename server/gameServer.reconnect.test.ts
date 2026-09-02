import assert from 'node:assert/strict';
import { createServer, type Server as HttpServer } from 'node:http';
import { afterEach, beforeEach, test } from 'node:test';
import { io as createClient, type Socket } from 'socket.io-client';
import { authService } from './authService';
import { GameServer } from './gameServer';

type InvitePayload = {
  fromName: string;
  roomCode: string;
  isRematch?: boolean;
};

let httpServer: HttpServer;
let gameServer: GameServer;
let clients: Socket[] = [];
let serverUrl = '';

function listen(server: HttpServer): Promise<number> {
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        reject(new Error('Test server did not expose a TCP address'));
        return;
      }
      resolve(address.port);
    });
  });
}

function waitForConnect(socket: Socket): Promise<void> {
  if (socket.connected) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Socket connection timed out')), 2000);
    socket.once('connect', () => {
      clearTimeout(timer);
      resolve();
    });
    socket.once('connect_error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
  });
}

function waitForEvent<T>(socket: Socket, event: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off(event, onEvent);
      reject(new Error(`Timed out waiting for ${event}`));
    }, 2000);
    const onEvent = (payload: T) => {
      clearTimeout(timer);
      resolve(payload);
    };
    socket.once(event, onEvent);
  });
}

function connectAs(userId: number, username: string): Socket {
  const socket = createClient(serverUrl, {
    auth: { token: authService.signToken({ userId, username }) },
    reconnection: false,
  });
  clients.push(socket);
  return socket;
}

async function disconnectClient(socket: Socket): Promise<void> {
  if (!socket.connected) return;
  await new Promise<void>((resolve) => {
    socket.once('disconnect', () => resolve());
    socket.disconnect();
  });
}

beforeEach(async () => {
  httpServer = createServer();
  gameServer = new GameServer(httpServer);
  // These tests exercise socket routing only. Avoid creating real social
  // profiles for synthetic users and keep the suite independent of database
  // state from previous runs.
  (gameServer as any).social = {
    createOrUpdateProfile: async () => {},
    notifyFriendsOnlineStatus: async () => {},
    getFriends: async () => [],
    getProfile: async () => null,
  };
  const port = await listen(httpServer);
  serverUrl = `http://127.0.0.1:${port}`;
  clients = [];
});

afterEach(async () => {
  await Promise.all(clients.map(disconnectClient));
  await new Promise<void>((resolve) => {
    if (!httpServer.listening) {
      resolve();
      return;
    }
    httpServer.close(() => resolve());
  });
  // Keep the instance referenced until teardown completes so the test
  // exercises the same GameServer lifecycle as the running application.
  void gameServer;
});

test('delivers a rematch to an authenticated opponent after reconnect', async () => {
  const sender = connectAs(1101, 'Sender');
  const oldOpponent = connectAs(1102, 'Opponent');
  await Promise.all([waitForConnect(sender), waitForConnect(oldOpponent)]);

  const oldSocketId = oldOpponent.id;
  await disconnectClient(oldOpponent);

  const replacementOpponent = connectAs(1102, 'Opponent');
  await waitForConnect(replacementOpponent);
  assert.notEqual(replacementOpponent.id, oldSocketId);

  const invitePromise = waitForEvent<InvitePayload>(replacementOpponent, 'matchInviteReceived');
  const roomPromise = waitForEvent<{ code: string }>(sender, 'privateRoomCreated');
  sender.emit('requestRematch', {
    opponentId: 'user_1102',
    category: 'science',
    difficulty: 'hard',
  });

  const [invite, room] = await Promise.all([invitePromise, roomPromise]);
  assert.equal(invite.isRematch, true);
  assert.equal(invite.fromName, 'Sender');
  assert.equal(invite.roomCode, room.code);
});

test('delivers a friend match invite through the replacement socket', async () => {
  const sender = connectAs(1201, 'Sender');
  const oldFriend = connectAs(1202, 'Friend');
  await Promise.all([waitForConnect(sender), waitForConnect(oldFriend)]);

  await disconnectClient(oldFriend);
  const replacementFriend = connectAs(1202, 'Friend');
  await waitForConnect(replacementFriend);

  const invitePromise = waitForEvent<InvitePayload>(replacementFriend, 'matchInviteReceived');
  const sentPromise = waitForEvent<{ targetPlayerId: string }>(sender, 'inviteSent');
  sender.emit('inviteToMatch', {
    targetPlayerId: '1202',
    roomCode: 'ABC234',
  });

  const [invite, sent] = await Promise.all([invitePromise, sentPromise]);
  assert.equal(invite.fromName, 'Sender');
  assert.equal(invite.roomCode, 'ABC234');
  assert.equal(sent.targetPlayerId, '1202');
});

test('an old socket disconnect cannot erase the replacement auth mapping', async () => {
  const sender = connectAs(1301, 'Sender');
  const oldOpponent = connectAs(1302, 'Opponent');
  const replacementOpponent = connectAs(1302, 'Opponent');
  await Promise.all([
    waitForConnect(sender),
    waitForConnect(oldOpponent),
    waitForConnect(replacementOpponent),
  ]);

  await disconnectClient(oldOpponent);
  // Allow the server-side disconnect callback to run before the request.
  await new Promise((resolve) => setTimeout(resolve, 25));

  const invitePromise = waitForEvent<InvitePayload>(replacementOpponent, 'matchInviteReceived');
  sender.emit('requestRematch', { opponentId: 'user_1302' });
  const invite = await invitePromise;

  assert.equal(invite.isRematch, true);
});