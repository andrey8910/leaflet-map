import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import * as L from 'leaflet';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MarkerColor } from '../interfaces/marker-color';
import { LatLngTuple } from 'leaflet';

@Component({
  selector: 'app-polygon-map',
  templateUrl: './polygon-map.component.html',
  styleUrls: ['./polygon-map.component.scss'],
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

  get latitudeControl(): number {
    return this.formGroupCoords.controls['latitude'].value;
  }

  get longitudeControl(): number {
    return this.formGroupCoords.controls['longitude'].value;
  }

  get markerColorControl(): MarkerColor {
    return this.formGroupCoords.controls['markerColor'].value;
  }

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.myMap = L.map(this.mapEl?.nativeElement).setView(this.centerCoords, this.mapZoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.myMap);

    L.control.scale().addTo(this.myMap);
  }

  addMarker(): void {
    const markerIcon = L.divIcon({
      className: 'select-color-marker',
      iconAnchor: [0, 24],
      html: `<span style="background-color: ${this.markerColorControl.colorValue}"></span>`,
    });

    const marker = L.marker([this.latitudeControl, this.longitudeControl], {
      icon: markerIcon,
      draggable: true,
    }).addTo(this.myMap);

    this.myMap.panTo(marker.getLatLng());
  }
}
