declare module '@capacitor/local-notifications' {
  export const LocalNotifications: {
    schedule(opts: {
      notifications: Array<{
        id: number;
        title: string;
        body: string;
        schedule: { at: Date };
        extra?: Record<string, unknown>;
      }>;
    }): Promise<unknown>;
    cancel(opts: { notifications: Array<{ id: number }> }): Promise<unknown>;
    requestPermissions(): Promise<{ display: 'granted' | 'denied' | 'prompt' }>;
  };
}
