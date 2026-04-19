import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Strongly-typed environment configuration (Single Source of Truth).
 * Follows SRP: only responsible for reading & validating env variables.
 */
export interface EnvConfig {
  baseURL: string;
  apiBaseURL: string;
  defaultUser: string;
  defaultPassword: string;
  ci: boolean;
}

class EnvironmentLoader {
  private config: EnvConfig;

  constructor() {
    this.config = {
      baseURL: this.required('BASE_URL', 'https://www.saucedemo.com'),
      apiBaseURL: process.env.API_BASE_URL ?? '',
      defaultUser: process.env.STANDARD_USER ?? 'standard_user',
      defaultPassword: this.required('PASSWORD', 'secret_sauce'),
      ci: !!process.env.CI,
    };
  }

  private required(key: string, fallback?: string): string {
    const value = process.env[key] ?? fallback;
    if (value === undefined) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
  }

  get(): EnvConfig {
    return this.config;
  }
}

export const Env: EnvConfig = new EnvironmentLoader().get();
