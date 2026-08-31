// Mock implementation for Web to prevent Metro Bundler errors
export const Capability = {
  Play: 0,
  Pause: 1,
  Stop: 2,
};

export const Event = {
  RemotePause: 'RemotePause',
  RemotePlay: 'RemotePlay',
  RemoteStop: 'RemoteStop',
};

const TrackPlayer = {
  registerPlaybackService: () => {},
  addEventListener: () => ({ remove: () => {} }),
  setupPlayer: async () => {},
  updateOptions: async () => {},
  add: async () => {},
  play: async () => {},
  pause: async () => {},
  stop: async () => {},
  reset: async () => {},
};

export default TrackPlayer;
