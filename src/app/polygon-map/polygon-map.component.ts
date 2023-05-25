import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import * as L from 'leaflet';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MarkerColor } from '../interfaces/marker-color';
import { LatLngTuple, LeafletMouseEvent, Marker } from 'leaflet';
import 'leaflet-draw';

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

  markersList: Marker[] = [];

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
    this.myMap = L.map(this.mapEl?.nativeElement, { drawControl: true })
      .setView(this.centerCoords, this.mapZoom)
      .on('click', () => {
        this.latitudeControl.reset();
        this.longitudeControl.reset();
      });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.myMap);
    L.layerGroup([...this.markersList]).addTo(this.myMap);
    //const drawControl = new L.Control.Draw();
    // this.myMap.addControl(drawControl);

    L.control.scale().addTo(this.myMap);
  }

  createMarker(): Marker {
    const markerIcon = L.divIcon({
      className: 'select-color-marker',
      iconAnchor: [0, 24],
      html: `<span style="background-color: ${this.markerColorControl.value.colorValue}"></span>`,
    });

    const marker = L.marker([this.latitudeControl.value, this.longitudeControl.value], {
      title: 'test',
      icon: markerIcon,
      draggable: true,
    })
      .on('drag', () => {
        this.latitudeControl.setValue(marker.getLatLng().lat);
        this.longitudeControl.setValue(marker.getLatLng().lng);
      })
      .on('click', (e: LeafletMouseEvent) => {
        this.latitudeControl.setValue(e.latlng.lat);
        this.longitudeControl.setValue(e.latlng.lng);
      });

    return marker;
  }

  addMarker(): void {
    const marker = this.createMarker();
    this.markersList.push(marker);

    const markersGroup = L.featureGroup([...this.markersList]).addTo(this.myMap);
    this.myMap.panTo(marker.getLatLng());
    this.myMap.fitBounds(markersGroup.getBounds());

    this.latitudeControl.reset();
    this.longitudeControl.reset();
    this.ref.markForCheck();
  }
}
