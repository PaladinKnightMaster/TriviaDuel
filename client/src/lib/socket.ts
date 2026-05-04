import { io, Socket } from 'socket.io-client';

const TOKEN_KEY = 'trivia_auth_token';

class SocketClient {
  private socket: Socket | null = null;
  private listeners: Map<string, ((...args: any[]) => void)[]> = new Map();

  connect() {
    if (this.socket?.connected) return this.socket;

    const token = localStorage.getItem(TOKEN_KEY);
    this.socket = io('/', {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      auth: token ? { token } : {},
    });

    this.socket.on('connect', () => {
      console.log('Connected to server:', this.socket?.id);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    // Re-attach all listeners
    this.listeners.forEach((callbacks, event) => {
      callbacks.forEach(callback => {
        this.socket?.on(event, callback);
      });
    });

    return this.socket;
  }

  reconnectWithToken(token: string | null) {
    // Disconnect current socket
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    // Reconnect with new auth token
    const auth = token ? { token } : {};
    this.socket = io('/', {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      auth,
    });

    this.socket.on('connect', () => {
      console.log('Reconnected to server:', this.socket?.id, token ? '[authenticated]' : '[guest]');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    // Re-attach all existing listeners to the new socket
    this.listeners.forEach((callbacks, event) => {
      callbacks.forEach(callback => {
        this.socket?.on(event, callback);
      });
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event: string, callback: (...args: any[]) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);

    if (this.socket?.connected) {
      this.socket.on(event, callback);
    } else if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event: string, callback: (...args: any[]) => void) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }

    if (this.socket) {
      this.socket.off(event, callback as any);
    }
  }

  emit(event: string, ...args: any[]) {
    if (this.socket?.connected) {
      this.socket.emit(event, ...args);
    } else {
      console.warn('Socket not connected, cannot emit:', event);
    }
  }

  get connected() {
    return this.socket?.connected || false;
  }

  get id() {
    return this.socket?.id;
  }
}

export const socketClient = new SocketClient();
