declare module "@mytracker/react-native-mytracker" {
  type EventParams = Record<string, string>;

  const RNMyTracker: {
    initTracker(sdkKey: string): boolean | null;
    setDebugMode(debugMode: boolean): void;
    isDebugMode(): boolean;
    trackEvent(name: string, eventParams?: EventParams): boolean | null | undefined;
    trackLoginEvent(userId: string): boolean | null;
    trackRegistrationEvent(userId: string): boolean | null;
    flush(): void;
  };

  export default RNMyTracker;
}
