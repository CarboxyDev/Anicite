import type { StatsDelta } from './storage';

export type UpdateStatsMessage = {
  type: 'UPDATE_STATS';
  payload: {
    key: string;
    url: string;
    host: string;
    path?: string;
    dateKey: string;
    hourKey: string;
    delta: StatsDelta;
  };
};

export type GetStatsMessage = {
  type: 'GET_STATS';
  payload: {
    key: string;
    dateKey: string;
  };
};

export type StatsResponse = {
  success: boolean;
  error?: string;
};

export type PingMessage = {
  type: 'PING';
};

export type PingResponse = {
  active: boolean;
};

export type Message = UpdateStatsMessage | GetStatsMessage | PingMessage;

export function sendUpdateStats(
  payload: UpdateStatsMessage['payload']
): Promise<StatsResponse> {
  return new Promise((resolve) => {
    try {
      chrome.runtime.sendMessage(
        { type: 'UPDATE_STATS', payload } satisfies UpdateStatsMessage,
        (response: StatsResponse | undefined) => {
          if (chrome.runtime.lastError) {
            resolve({
              success: false,
              error: chrome.runtime.lastError.message,
            });
            return;
          }
          resolve(response ?? { success: false, error: 'No response' });
        }
      );
    } catch (err) {
      resolve({
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  });
}
