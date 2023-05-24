import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import * as L from 'leaflet';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MarkerColor } from '../interfaces/marker-color';
import { LatLngTuple, LeafletEvent, LeafletMouseEvent } from 'leaflet';

@Component({
  selector: 'app-polygon-map',
  templateUrl: './polygon-map.component.html',
  styleUrls: ['./polygon-map.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PolygonMapComponent implements OnInit {
  @Input('center') centerCoords: LatLngTuple = [0, 0];
  @Input('zoom') mapZoom = 1;
  @ViewChild('map', { static: true }) mapEl: ElementRef | undefined;
  @ViewChild('coords', { static: true }) coordsEl: ElementRef | undefined;
  myMap: any;

  markersColorList: MarkerColor[] = [
    { colorName: 'red', colorValue: '#f70202' },
    { colorName: 'green', colorValue: '#019421' },
    { colorName: 'blue', colorValue: '#012394' },
    { colorName: 'yellow', colorValue: '#f5ec42' },
  ];

  formGroupCoords: FormGroup = this.fb.group({
    latitude: new FormControl('', [
      Validators.pattern(/^([+-])?(?:90(?:\.0{1,6})?|((?:|[1-8])[0-9])(?:\.[0-9]{1,9})?)$/),
      Validators.required,
    ]),
    longitude: new FormControl('', [
      Validators.pattern(/^([+-])?(?:180(?:\.0{1,6})?|((?:|[1-9]|1[0-7])[0-9])(?:\.[0-9]{1,9})?)$/),
      Validators.required,
    ]),
    markerColor: new FormControl<MarkerColor>(this.markersColorList[0]),
  });

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
    this.myMap = L.map(this.mapEl?.nativeElement)
      .setView(this.centerCoords, this.mapZoom)
      .on('click', () => {
        this.latitudeControl.reset();
        this.longitudeControl.reset();
      });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.myMap);

    L.control.scale().addTo(this.myMap);
  }

  addMarker(): void {
    const markerIcon = L.divIcon({
      className: 'select-color-marker',
      iconAnchor: [0, 24],
      html: `<span style="background-color: ${this.markerColorControl.value.colorValue}"></span>`,
    });

    const marker = L.marker([this.latitudeControl.value, this.longitudeControl.value], {
      icon: markerIcon,
      draggable: true,
    })
      .addTo(this.myMap)
      .on('drag', (e: LeafletEvent) => {
        this.latitudeControl.setValue(marker.getLatLng().lat);
        this.longitudeControl.setValue(marker.getLatLng().lng);
      })
      .on('click', (e: LeafletMouseEvent) => {
        this.latitudeControl.setValue(e.latlng.lat);
        this.longitudeControl.setValue(e.latlng.lng);
      });

    this.myMap.panTo(marker.getLatLng());
    this.latitudeControl.reset();
    this.longitudeControl.reset();
    this.ref.markForCheck();
  }
}
