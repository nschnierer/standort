declare namespace NodeJS {
  export interface ProcessEnv {
    NODE_ENV: string;
    SIGNALING_PORT: string;
    SIGNALING_API_KEY: string;
  }
}
