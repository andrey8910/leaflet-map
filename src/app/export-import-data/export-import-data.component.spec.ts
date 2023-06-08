import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExportImportDataComponent } from './export-import-data.component';

describe('ExportImportDataComponent', () => {
  let component: ExportImportDataComponent;
  let fixture: ComponentFixture<ExportImportDataComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ExportImportDataComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExportImportDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
