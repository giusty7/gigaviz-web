declare global {
  type FbLoginResponse = { authResponse?: { code?: string } };
  type FbLoginParams = Record<string, unknown>;
  type FbInitConfig = Record<string, unknown>;

  interface Window {
    FB?: {
      init: (config: FbInitConfig) => void;
      login: (callback: (response: FbLoginResponse) => void, params: FbLoginParams) => void;
    };
    fbAsyncInit?: () => void;
  }
}

export {};