import { ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, Output, Renderer2, ViewChild } from '@angular/core';
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

  @Output() fileToImport = new EventEmitter<FeatureGroup>();

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

  import(event: Event) {
    const files: FileList = <FileList>(<HTMLInputElement>event.target).files;
    const reader = new FileReader();

    reader.onload = (e: any) => {
      const target = e.target.result;
      if (target) {
        const importFile = JSON.parse(target);
        this.fileToImport.emit(importFile);
      }
    };
    reader.readAsText(files[0]);
  }
}
