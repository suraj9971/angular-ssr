import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface RuntimeConfig {
  BASE_CURRENCY: string;
  BASE_LANGUAGE: string;
  BASE_SITE_ID: string;
  OCC_BASE_URL: string;
  WEBSITE_NODE_DEFAULT_VERSION: string;
}

interface RuntimeConfigWindow extends Window {
  __APP_RUNTIME_CONFIG__?: Partial<RuntimeConfig>;
  __APP_RUNTIME_CONFIG_SOURCE__?: string;
}

// No hardcoded values here on purpose: locally they come from assets/env.json,
// on Azure they come from process.env (App Settings). This is just the empty
// shape used until loadConfig() resolves one of those two sources.
export const defaultRuntimeConfig: RuntimeConfig = {
  BASE_CURRENCY: '',
  BASE_LANGUAGE: '',
  BASE_SITE_ID: '',
  OCC_BASE_URL: '',
  WEBSITE_NODE_DEFAULT_VERSION: ''
};

@Injectable({ providedIn: 'root' })
export class RuntimeConfigService {
  private config: RuntimeConfig = defaultRuntimeConfig;
  private source = 'defaults';

  constructor(@Inject(PLATFORM_ID) private platformId: object) {}

  mergeConfig(base: RuntimeConfig, overrides: Partial<RuntimeConfig> | null | undefined): RuntimeConfig {
    return {
      ...base,
      ...(overrides || {})
    };
  }

  async loadConfig(): Promise<RuntimeConfig> {
    const resolved = await this.loadRuntimeConfig();
    this.config = this.mergeConfig(defaultRuntimeConfig, resolved.config);
    this.source = resolved.source;

    const runtimeState = this.getRuntimeState();
    runtimeState.__APP_RUNTIME_CONFIG__ = this.config;
    runtimeState.__APP_RUNTIME_CONFIG_SOURCE__ = this.source;

    // Debug checkpoint: pause here in DevTools (or attach a debugger) to inspect
    // `this.config` / `this.source` and confirm which environment supplied it.
    // Local dev  -> source is 'assets/env.json'
    // Azure/server -> source is 'process.env'
    debugger;
    console.info(
      `%c[RuntimeConfig] Active source: ${this.source}`,
      'color: white; background: #0b5; padding: 2px 6px; border-radius: 3px;',
      this.config
    );
    return this.config;
  }

  getConfig(): RuntimeConfig {
    return this.config;
  }

  getSource(): string {
    return this.source;
  }

  private async loadRuntimeConfig(): Promise<{ config: Partial<RuntimeConfig>; source: string }> {
    const runtimeState = this.getRuntimeState();

    if (runtimeState.__APP_RUNTIME_CONFIG__) {
      return {
        config: this.normalize(runtimeState.__APP_RUNTIME_CONFIG__),
        source: runtimeState.__APP_RUNTIME_CONFIG_SOURCE__ || 'runtime-state'
      };
    }

    if (typeof process !== 'undefined' && process?.env) {
      const processConfig = this.collectFromProcessEnv(process.env);
      if (this.hasValues(processConfig)) {
        return { config: this.normalize(processConfig), source: 'process.env' };
      }
    }

    if (isPlatformBrowser(this.platformId)) {
      try {
        const response = await fetch('/assets/env.json', { cache: 'no-store' });
        if (!response.ok) {
          console.warn('[RuntimeConfig] /assets/env.json not found; using defaults.');
          return { config: {}, source: 'defaults' };
        }

        const data = await response.json();
        return { config: this.normalize(data), source: 'assets/env.json' };
      } catch (error) {
        console.warn('[RuntimeConfig] Failed to load /assets/env.json; using defaults.', error);
        return { config: {}, source: 'defaults' };
      }
    }

    return { config: {}, source: 'defaults' };
  }

  private collectFromProcessEnv(env: Record<string, string | undefined>): Partial<RuntimeConfig> {
    return {
      BASE_CURRENCY: env['BASE_CURRENCY'],
      BASE_LANGUAGE: env['BASE_LANGUAGE'],
      BASE_SITE_ID: env['BASE_SITE_ID'],
      OCC_BASE_URL: env['OCC_BASE_URL'],
      WEBSITE_NODE_DEFAULT_VERSION: env['WEBSITE_NODE_DEFAULT_VERSION']
    };
  }

  private hasValues(input: Partial<RuntimeConfig> | null | undefined): boolean {
    if (!input) {
      return false;
    }

    return Object.values(input).some((value) => typeof value === 'string' && value.trim().length > 0);
  }

  private normalize(input: Partial<RuntimeConfig> | null | undefined): Partial<RuntimeConfig> {
    if (!input) {
      return {};
    }

    return {
      BASE_CURRENCY: input.BASE_CURRENCY?.trim() || defaultRuntimeConfig.BASE_CURRENCY,
      BASE_LANGUAGE: input.BASE_LANGUAGE?.trim() || defaultRuntimeConfig.BASE_LANGUAGE,
      BASE_SITE_ID: input.BASE_SITE_ID?.trim() || defaultRuntimeConfig.BASE_SITE_ID,
      OCC_BASE_URL: input.OCC_BASE_URL?.trim() || defaultRuntimeConfig.OCC_BASE_URL,
      WEBSITE_NODE_DEFAULT_VERSION: input.WEBSITE_NODE_DEFAULT_VERSION?.trim() || defaultRuntimeConfig.WEBSITE_NODE_DEFAULT_VERSION
    };
  }

  private getRuntimeState(): RuntimeConfigWindow {
    return (typeof window !== 'undefined'
      ? window
      : globalThis) as unknown as RuntimeConfigWindow;
  }
}
