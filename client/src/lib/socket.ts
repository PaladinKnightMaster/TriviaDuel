import { io, Socket } from 'socket.io-client';

class SocketClient {
  private socket: Socket | null = null;
  private listeners: Map<string, Function[]> = new Map();

  connect() {
    if (this.socket?.connected) return this.socket;

    this.socket = io('/', {
      transports: ['websocket', 'polling'],
      autoConnect: true,
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

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);

    if (this.socket?.connected) {
      this.socket.on(event, callback as any);
    }
  }

  off(event: string, callback: Function) {
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
