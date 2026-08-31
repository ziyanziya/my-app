/**
 * Mock safe replacement for react-native-track-player.
 * We use expo-av directly in adhan.service.ts instead.
 * This file exists only to prevent import errors.
 */

export enum Capability {
  Play = 0,
  Pause = 1,
  Stop = 2,
  SeekTo = 3,
  Skip = 4,
  SkipToNext = 5,
  SkipToPrevious = 6,
  JumpForward = 7,
  JumpBackward = 8,
}

export enum Event {
  PlaybackState = 'playback-state',
  PlaybackError = 'playback-error',
  PlaybackQueueEnded = 'playback-queue-ended',
  PlaybackMetadataReceived = 'playback-metadata-received',
  RemotePlay = 'remote-play',
  RemotePause = 'remote-pause',
  RemoteStop = 'remote-stop',
  RemoteSkip = 'remote-skip',
  RemoteNext = 'remote-next',
  RemotePrevious = 'remote-previous',
  RemoteSeek = 'remote-seek',
}

const noop = async (..._args: any[]) => {};

const TrackPlayer = {
  setupPlayer: noop,
  updateOptions: noop,
  add: noop,
  play: noop,
  pause: noop,
  stop: noop,
  reset: noop,
  skip: noop,
  skipToNext: noop,
  skipToPrevious: noop,
  seekTo: noop,
  getVolume: async () => 1,
  setVolume: noop,
  getRate: async () => 1,
  setRate: noop,
  getTrack: async () => null,
  getQueue: async () => [],
  remove: noop,
  removeUpcomingTracks: noop,
  updateMetadataForTrack: noop,
  getDuration: async () => 0,
  getPosition: async () => 0,
  getBufferedPosition: async () => 0,
  getState: async () => 0,
  getRepeatMode: async () => 0,
  setRepeatMode: noop,
  addEventListener: () => ({ remove: () => {} }),
};

export default TrackPlayer;
