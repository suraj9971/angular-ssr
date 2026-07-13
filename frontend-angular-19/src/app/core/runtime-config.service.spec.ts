import { TestBed } from '@angular/core/testing';
import { RuntimeConfigService, defaultRuntimeConfig, RuntimeConfig } from './runtime-config.service';

describe('RuntimeConfigService', () => {
  let service: RuntimeConfigService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RuntimeConfigService);
  });

  it('should merge defaults with runtime overrides', () => {
    const merged = service.mergeConfig(defaultRuntimeConfig, {
      BASE_CURRENCY: 'EUR',
      OCC_BASE_URL: 'https://example.com'
    } as Partial<RuntimeConfig>);

    expect(merged.BASE_CURRENCY).toBe('EUR');
    expect(merged.OCC_BASE_URL).toBe('https://example.com');
    expect(merged.BASE_LANGUAGE).toBe(defaultRuntimeConfig.BASE_LANGUAGE);
  });
});
