import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MarkerColor } from '../interfaces/marker-color';
import { DrawMap, Layer, Marker } from 'leaflet';
import * as L from 'leaflet';
import { tap } from 'rxjs';
import { Coordinates } from '../interfaces/coordinates';

@Component({
  selector: 'app-coords-markers',
  templateUrl: './coords-marker.component.html',
  styleUrls: ['./coords-marker.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoordsMarkerComponent implements OnInit {
  @Input() map!: DrawMap;
  @Input() set colorList(value: MarkerColor[]) {
    this.listColor = value;
    this.markerColorControl.setValue(value[0]);
    this.emitColorMarker.emit(value[0]);
  }
  @Input() set markerCoords(value: Coordinates) {
    this.latitudeControl.setValue(value.lat);
    this.longitudeControl.setValue(value.lng);
    this.ref.markForCheck();
  }

  @Output() emitMarker = new EventEmitter<Marker>();
  @Output() emitColorMarker = new EventEmitter<MarkerColor>();

  @ViewChild('coords', { static: true }) coordsEl: ElementRef | undefined;

  markersList = new L.LayerGroup();

  formGroupCoords: FormGroup = this.fb.group({
    latitude: new FormControl('', [
      Validators.pattern(/^([+-])?(?:90(?:\.0{1,6})?|((?:|[1-8])[0-9])(?:\.[0-9]{1,9})?)$/),
      Validators.required,
    ]),
    longitude: new FormControl('', [
      Validators.pattern(/^([+-])?(?:180(?:\.0{1,6})?|((?:|[1-9]|1[0-7])[0-9])(?:\.[0-9]{1,9})?)$/),
      Validators.required,
    ]),
    markerColor: new FormControl<MarkerColor>({ colorName: '', colorValue: '' }),
  });
  private listColor: MarkerColor[] = [];

  get markersColorList() {
    return this.listColor;
  }

  get latitudeControl(): AbstractControl {
    return this.formGroupCoords.controls['latitude'];
  }

  get longitudeControl(): AbstractControl {
    return this.formGroupCoords.controls['longitude'];
  }

  get markerColorControl(): AbstractControl {
    return this.formGroupCoords.controls['markerColor'];
  }
  constructor(private fb: FormBuilder, private ref: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.markerColorControl.valueChanges
      .pipe(
        tap((color) => {
          this.emitColorMarker.emit(color);
        })
      )
      .subscribe();
    this.markersList.addTo(this.map);
    this.map.on('click', () => {
      this.latitudeControl.reset();
      this.longitudeControl.reset();
    });
    this.latitudeControl.reset();
    this.longitudeControl.reset();
    this.ref.markForCheck();
  }

  addMarker(): void {
    const marker = this.createMarker();

    L.geoJSON(marker.toGeoJSON(), {
      pointToLayer(geoJsonPoint, latlng): Layer {
        return L.marker(latlng, {
          icon: marker.getIcon(),
          alt: 'Marker',
        });
      },
    }).eachLayer((layer: any) => {
      layer
        .on('drag', () => {
          this.latitudeControl.setValue(layer.getLatLng().lat);
          this.longitudeControl.setValue(layer.getLatLng().lng);
        })
        .on('click', () => {
          this.latitudeControl.setValue(layer.getLatLng().lat);
          this.longitudeControl.setValue(layer.getLatLng().lng);
        });
      layer.feature.properties['icon'] = layer.getIcon();
      layer.feature.properties['colorMarker'] = this.markerColorControl.value.colorValue;
      this.emitMarker.emit(layer);
    });

    this.latitudeControl.reset();
    this.longitudeControl.reset();

    this.ref.markForCheck();
  }

  private createMarker(): Marker {
    const markerIcon = L.divIcon({
      className: 'select-color-marker',
      html: `<span style="background-color: ${this.markerColorControl.value.colorValue}"></span>`,
    });

    return L.marker([this.latitudeControl.value, this.longitudeControl.value], {
      title: 'marker',
      icon: markerIcon,
    });
  }
}
