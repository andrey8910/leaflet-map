import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import * as L from 'leaflet';

@Component({
  selector: 'app-osm-map',
  templateUrl: './osm-map.component.html',
  styleUrls: ['./osm-map.component.scss'],
})
export class OsmMapComponent implements OnInit {
  @ViewChild('map', { static: true }) map: ElementRef | undefined;
  myMap: any;

  ngOnInit() {
    this.myMap = L.map(this.map?.nativeElement).setView([48.5132, 32.2597], 16);

    const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.myMap);

    const spinalLayer = L.tileLayer('https://{s}.tile.thunderforest.com/spinal-map/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.myMap);

    const baseMap = {
      spinal: spinalLayer,
      osm: osmLayer,
    };
    const myMarkerIcon = L.icon({
      iconUrl:
        'https://static.vecteezy.com/system/resources/thumbnails/010/157/991/small/pin-location-icon-sign-symbol-design-free-png.png',
      className: 'my-marker-icon',
      iconSize: [40, 60],
      iconAnchor: [20, 60],
      popupAnchor: [0, -60],
      tooltipAnchor: [20, -40],
    });

    const marker1 = L.marker([48.5122, 32.2587], {
      icon: myMarkerIcon,
      draggable: true,
    })
      .bindPopup('MARKER 1')
      .bindTooltip('marker 1 tooltip');
    // .addTo(this.myMap);

    const marker2 = L.marker([48.5139, 32.2599], {
      icon: myMarkerIcon,
      draggable: true,
    })
      .bindPopup('MARKER 2')
      .bindTooltip('marker 2 tooltip');
    // .addTo(this.myMap);

    const marker3 = L.marker([48.515, 32.25], {
      icon: myMarkerIcon,
      draggable: true,
    })
      .bindPopup('MARKER 3')
      .bindTooltip('marker 3 tooltip');

    const markerGroup = L.layerGroup([marker1, marker2, marker3]).addTo(this.myMap);

    const markerPolygon = L.polygon([
      [48.5122, 32.2587],
      [48.5139, 32.2599],
      [48.515, 32.25],
    ]).addTo(this.myMap);

    L.control
      .layers(baseMap, {
        'all markers': markerGroup,
        //'marker 1': marker1,
        //'marker 2': marker2,
      })
      .addTo(this.myMap);
  }
}
