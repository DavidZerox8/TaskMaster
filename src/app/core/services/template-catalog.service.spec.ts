import { TestBed } from '@angular/core/testing';
import { TemplateCatalogService } from './template-catalog.service';

describe('TemplateCatalogService', () => {
  let service: TemplateCatalogService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TemplateCatalogService);
  });

  it('exposes 10 templates', () => {
    expect(service.getAll().length).toBe(10);
  });

  it('each template has a valid create request shape', () => {
    for (const tpl of service.getAll()) {
      expect(tpl.id).toBeTruthy();
      expect(tpl.request.name).toBeTruthy();
      expect(tpl.request.scheduleType).toBeTruthy();
      expect(tpl.request.scheduleConfig).toBeTruthy();
    }
  });

  it('toCreateRequests filters unknown ids', () => {
    const reqs = service.toCreateRequests(['morning-routine', 'does-not-exist', 'hydration']);
    expect(reqs.length).toBe(2);
    expect(reqs[0].name).toBe('Rutina matinal');
  });
});
