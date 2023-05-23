import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import * as L from 'leaflet';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-polygon-map',
  templateUrl: './polygon-map.component.html',
  styleUrls: ['./polygon-map.component.scss'],
})
export class PolygonMapComponent implements OnInit {
  @ViewChild('map', { static: true }) mapEl: ElementRef | undefined;
  @ViewChild('coords', { static: true }) coordsEl: ElementRef | undefined;
  myMap: any;

  formGroupCoords: FormGroup = this.fb.group({
    latitude: new FormControl('', Validators.required),
    longitude: new FormControl('', Validators.required),
  });

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    this.myMap = L.map(this.mapEl?.nativeElement).setView([48.5132, 32.2597], 16);
    const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.myMap);

    L.control.scale().addTo(this.myMap);
  }

  addMarker(): void {
    console.log(this.formGroupCoords.value);
  }
}
