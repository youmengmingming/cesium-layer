import { onUnmounted, ref } from 'vue';

type BridgeRole = 'primary' | 'secondary';
type ConnectionState = 'standalone' | 'connecting' | 'connected';

interface BridgeMessage<T = any> {
  type: string;
  payload?: T;
}

type MessageHandler = (payload: any) => void;

const CHANNEL_PREFIX = 'cesium-window-bridge';
const STORAGE_KEY = 'cesium-window-bridge:id';

const isBrowser = typeof window !== 'undefined';

const createId = () => {
  if (isBrowser && typeof window.crypto !== 'undefined' && typeof window.crypto.randomUUID === 'function') {
    return window.crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
};

export function useWindowBridge() {
  const role = ref<BridgeRole>('primary');
  const channelId = ref<string | null>(null);
  const connectionState = ref<ConnectionState>('standalone');
  const channel = ref<BroadcastChannel | null>(null);
  const isInitialized = ref(false);
  const listeners = new Map<string, Set<MessageHandler>>();
  let beforeUnloadHandler: (() => void) | null = null;

  const determineRole = () => {
    if (!isBrowser) {
      role.value = 'primary';
      return;
    }
    const params = new URLSearchParams(window.location.search);
    role.value = params.get('role') === 'secondary' ? 'secondary' : 'primary';
  };

  const hydrateChannelId = () => {
    if (!isBrowser) {
      return;
    }
    if (channelId.value) {
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get('channelId');
    const fromStorage = window.sessionStorage.getItem(STORAGE_KEY);

    if (fromQuery) {
      channelId.value = fromQuery;
      window.sessionStorage.setItem(STORAGE_KEY, fromQuery);
      return;
    }

    if (fromStorage) {
      channelId.value = fromStorage;
      return;
    }

    if (role.value === 'primary') {
      const newId = createId();
      channelId.value = newId;
      window.sessionStorage.setItem(STORAGE_KEY, newId);
    }
  };

  const emit = (type: string, payload: any) => {
    const handlers = listeners.get(type);
    if (!handlers) {
      return;
    }
    handlers.forEach((handler) => handler(payload));
  };

  const attachChannel = () => {
    if (!isBrowser || channel.value || !channelId.value) {
      return;
    }

    channel.value = new BroadcastChannel(`${CHANNEL_PREFIX}:${channelId.value}`);
    if (role.value === 'secondary') {
      connectionState.value = 'connecting';
      // 让主窗口有机会先建立监听再收到消息
      setTimeout(() => {
        sendMessage('bridge:secondary-ready', { at: Date.now() });
      }, 50);
    }

    channel.value.onmessage = (event: MessageEvent<BridgeMessage>) => {
      const { type, payload } = event.data || {};
      if (!type) {
        return;
      }

      if (type === 'bridge:secondary-ready' && role.value === 'primary') {
        connectionState.value = 'connected';
        sendMessage('bridge:primary-ready', { at: Date.now() });
      } else if (type === 'bridge:primary-ready' && role.value === 'secondary') {
        connectionState.value = 'connected';
      } else if (type === 'bridge:window-closed') {
        if (payload?.role === 'secondary' && role.value === 'primary') {
          connectionState.value = 'standalone';
        }
        if (payload?.role === 'primary' && role.value === 'secondary') {
          connectionState.value = 'standalone';
        }
      }

      emit(type, payload);
    };

    if (!beforeUnloadHandler) {
      beforeUnloadHandler = () => {
        sendMessage('bridge:window-closed', { role: role.value });
      };
      window.addEventListener('beforeunload', beforeUnloadHandler);
    }
  };

  const init = () => {
    if (!isBrowser || isInitialized.value) {
      return;
    }
    determineRole();
    hydrateChannelId();
    attachChannel();
    isInitialized.value = true;
  };

  const ensureChannel = () => {
    if (!isBrowser) {
      return;
    }
    if (!channelId.value) {
      const newId = createId();
      channelId.value = newId;
      window.sessionStorage.setItem(STORAGE_KEY, newId);
    }
    if (!channel.value) {
      attachChannel();
    }
  };

  const openSecondaryWindow = () => {
    if (!isBrowser || role.value !== 'primary') {
      return;
    }
    ensureChannel();
    if (!channelId.value) {
      return;
    }

    const url = new URL(window.location.href);
    url.searchParams.set('channelId', channelId.value);
    url.searchParams.set('role', 'secondary');

    const features = [
      'noopener',
      'noreferrer',
      'width=1280',
      'height=720',
      'left=120',
      'top=60',
    ].join(',');

    const child = window.open(url.toString(), '_blank', features);
    if (child) {
      connectionState.value = 'connecting';
      child.focus();
    }
  };

  const sendMessage = (type: string, payload?: any) => {
    if (!channel.value) {
      return;
    }
    const message: BridgeMessage = { type, payload };
    channel.value.postMessage(message);
  };

  const onMessage = (type: string, handler: MessageHandler) => {
    if (!listeners.has(type)) {
      listeners.set(type, new Set());
    }
    listeners.get(type)!.add(handler);
    return () => {
      listeners.get(type)!.delete(handler);
      if (listeners.get(type)?.size === 0) {
        listeners.delete(type);
      }
    };
  };

  onUnmounted(() => {
    channel.value?.close();
    listeners.clear();
    if (beforeUnloadHandler && isBrowser) {
      window.removeEventListener('beforeunload', beforeUnloadHandler);
      beforeUnloadHandler = null;
    }
  });

  return {
    init,
    role,
    channelId,
    connectionState,
    openSecondaryWindow,
    sendMessage,
    onMessage,
  };
}

