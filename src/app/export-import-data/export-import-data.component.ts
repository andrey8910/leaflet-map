import { ChangeDetectorRef, Component, ElementRef, Input, Renderer2, ViewChild } from '@angular/core';
import { DrawMap, FeatureGroup } from 'leaflet';
import * as L from 'leaflet';

@Component({
  selector: 'app-export-import-data',
  templateUrl: './export-import-data.component.html',
  styleUrls: ['./export-import-data.component.scss'],
})
export class ExportImportDataComponent {
  @Input() map!: DrawMap;
  @Input() set mapItems(value: FeatureGroup) {
    this.items = value;
    this.ref.markForCheck();
  }
  @ViewChild('exportBtn', { static: true }) exportBTN: ElementRef | undefined;
  @ViewChild('importBtn', { static: true }) importBTN: ElementRef | undefined;
  get mapItems(): FeatureGroup {
    return this.items;
  }
  private items = new L.FeatureGroup();
  constructor(private renderer: Renderer2, private ref: ChangeDetectorRef) {}

  export() {
    const convertedData = 'text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(this.mapItems.toGeoJSON()));
    if (this.exportBTN?.nativeElement) {
      this.renderer.setAttribute(this.exportBTN.nativeElement, 'href', 'data:' + convertedData);
      this.renderer.setAttribute(this.exportBTN.nativeElement, 'download', 'data.geojson');
    }
  }

  import() {}
}
