import { onUnmounted, watch } from 'vue';
import * as Cesium from 'cesium';

interface CameraStatePayload {
  longitude: number;
  latitude: number;
  height: number;
  heading: number;
  pitch: number;
  roll: number;
}

interface UseCameraSyncOptions {
  viewer: { value: Cesium.Viewer | null };
  isPrimary: { value: boolean };
  sendMessage: (type: string, payload?: any) => void;
  onMessage: (type: string, handler: (payload: any) => void) => () => void;
}

const CAMERA_EVENT = 'bridge:camera-update';
const CAMERA_INTERVAL = 10;

export function useCameraSync(options: UseCameraSyncOptions) {
  let detachCameraChanged: (() => void) | null = null;
  let stopCameraListener: (() => void) | null = null;
  let lastBroadcastAt = 0;

  const disposeListeners = () => {
    if (detachCameraChanged) {
      detachCameraChanged();
      detachCameraChanged = null;
    }
    if (stopCameraListener) {
      stopCameraListener();
      stopCameraListener = null;
    }
  };

  const broadcastCameraState = (viewer: Cesium.Viewer, force = false) => {
    if (!viewer || viewer.isDestroyed() || !options.isPrimary.value) {
      return;
    }

    const timestamp = performance.now();
    if (!force && timestamp - lastBroadcastAt < CAMERA_INTERVAL) {
      return;
    }

    lastBroadcastAt = timestamp;

    const cartographic = viewer.camera.positionCartographic;
    if (!cartographic) {
      return;
    }

    options.sendMessage(CAMERA_EVENT, {
      longitude: cartographic.longitude,
      latitude: cartographic.latitude,
      height: cartographic.height,
      heading: viewer.camera.heading,
      pitch: viewer.camera.pitch,
      roll: viewer.camera.roll,
    } satisfies CameraStatePayload);
  };

  const applyCameraState = (viewer: Cesium.Viewer, payload: CameraStatePayload) => {
    if (!viewer || viewer.isDestroyed()) {
      return;
    }

    const destination = Cesium.Cartesian3.fromRadians(payload.longitude, payload.latitude, payload.height);
    viewer.camera.setView({
      destination,
      orientation: {
        heading: payload.heading,
        pitch: payload.pitch,
        roll: payload.roll,
      },
    });
  };

  const attachToViewer = (viewer: Cesium.Viewer | null) => {
    disposeListeners();
    if (!viewer) {
      return;
    }

    if (options.isPrimary.value) {
      const cameraHandler = () => broadcastCameraState(viewer);
      viewer.camera.changed.addEventListener(cameraHandler);
      detachCameraChanged = () => viewer.camera.changed.removeEventListener(cameraHandler);
      broadcastCameraState(viewer, true);
    }

    stopCameraListener = options.onMessage(CAMERA_EVENT, (payload: CameraStatePayload) => {
      if (!payload || options.isPrimary.value) {
        return;
      }
      applyCameraState(viewer, payload);
    });
  };

  const secondaryReadyDisposer = options.onMessage('bridge:secondary-ready', () => {
    if (options.isPrimary.value && options.viewer.value) {
      broadcastCameraState(options.viewer.value, true);
    }
  });

  watch(
    () => options.viewer.value,
    (nextViewer) => {
      attachToViewer(nextViewer);
    },
    { immediate: true }
  );

  onUnmounted(() => {
    disposeListeners();
    secondaryReadyDisposer();
  });

  return {
    forceSync: () => {
      if (options.viewer.value) {
        broadcastCameraState(options.viewer.value, true);
      }
    },
  };
}

