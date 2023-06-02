import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CoordsMarkerComponent } from './coords-marker.component';

describe('CoordsMarkerComponent', () => {
  let component: CoordsMarkerComponent;
  let fixture: ComponentFixture<CoordsMarkerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CoordsMarkerComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CoordsMarkerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
