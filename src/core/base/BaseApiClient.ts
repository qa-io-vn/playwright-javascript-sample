import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ILogger, logger } from '../logger/Logger';

/**
 * Abstract BaseApiClient - thin, typed wrapper around axios.
 * Subclasses implement resource-specific clients (e.g. UsersApiClient, OrdersApiClient).
 */
export abstract class BaseApiClient {
  protected readonly http: AxiosInstance;

  protected constructor(
    baseURL: string,
    protected readonly log: ILogger = logger,
    defaultHeaders: Record<string, string> = {},
  ) {
    this.http = axios.create({
      baseURL,
      timeout: 30_000,
      headers: { 'Content-Type': 'application/json', ...defaultHeaders },
    });

    this.http.interceptors.request.use((req) => {
      this.log.debug(`API → ${req.method?.toUpperCase()} ${req.url}`);
      return req;
    });
    this.http.interceptors.response.use(
      (res) => {
        this.log.debug(`API ← ${res.status} ${res.config.url}`);
        return res;
      },
      (err) => {
        this.log.error(`API ✗ ${err?.response?.status} ${err?.config?.url}`, {
          data: err?.response?.data,
        });
        return Promise.reject(err);
      },
    );
  }

  protected get<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.http.get<T>(url, config);
  }
  protected post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.http.post<T>(url, data, config);
  }
  protected put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.http.put<T>(url, data, config);
  }
  protected delete<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.http.delete<T>(url, config);
  }
}
