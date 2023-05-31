import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import * as L from 'leaflet';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MarkerColor } from '../interfaces/marker-color';
import { DrawMap, LatLngTuple, LeafletEvent, LeafletMouseEvent, Marker } from 'leaflet';
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
  myMap!: DrawMap;
  drawnItems = new L.FeatureGroup();

  markersList = new L.LayerGroup();

  markersColorList: MarkerColor[] = [
    { colorName: 'red', colorValue: '#f70202' },
    { colorName: 'green', colorValue: '#019421' },
    { colorName: 'blue', colorValue: '#012394' },
    { colorName: 'yellow', colorValue: '#f5ec42' },
  ];

  drawPolygonColor = 'rgba(250, 0, 0, 0.8)';
  drawPolygonWeight = 4;

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
    this.myMap = this.createMap();

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.myMap);

    L.Icon.Default.imagePath = 'assets/';
    this.markersList.addTo(this.myMap);

    const drawControl = new L.Control.Draw({
      position: 'topright',
      draw: {
        polyline: {
          shapeOptions: {
            color: this.drawPolygonColor,
            weight: this.drawPolygonWeight,
          },
        },
        polygon: {
          shapeOptions: {
            color: this.drawPolygonColor,
            weight: this.drawPolygonWeight,
          },
        },
        marker: {
          icon: L.icon({
            iconSize: [25, 41],
            iconAnchor: [13, 41],
            iconUrl: 'assets/marker-icon.png',
            shadowUrl: 'assets/marker-shadow.png',
          }),
        },
        rectangle: <any>{
          showArea: false,
          shapeOptions: {
            color: this.drawPolygonColor,
            weight: this.drawPolygonWeight,
          },
        },
      },
      edit: {
        featureGroup: this.drawnItems,
      },
    });

    this.myMap.addControl(drawControl);
    this.drawnItems.addTo(this.myMap);

    L.control.scale().addTo(this.myMap);

    if (localStorage.getItem('drawn-items')) {
      const drawItems = localStorage.getItem('drawn-items');
      if (drawItems === null) {
        return;
      }
      const drawItemJson = JSON.parse(drawItems);
      drawItemJson.features.map((feature: any) => {
        const featureType = feature.properties.type;
        L.geoJSON(feature, {
          style: {
            color: this.drawPolygonColor,
            weight: this.drawPolygonWeight,
            opacity: 0.65,
          },
          pointToLayer: function (geoJsonPoint, latlng) {
            return featureType === 'circlemarker'
              ? new L.CircleMarker(latlng, { radius: 10 })
              : featureType === 'circle'
              ? new L.Circle(latlng, { radius: feature.properties.radius })
              : L.marker(latlng, {
                  icon: L.icon({
                    iconSize: [25, 41],
                    iconAnchor: [13, 41],
                    iconUrl: 'assets/marker-icon.png',
                    shadowUrl: 'assets/marker-shadow.png',
                  }),
                });
          },
        }).eachLayer((layer: any) => {
          layer.feature.properties['type'] = featureType;
          if (featureType === 'circlemarker' || featureType === 'circle') {
            layer.feature.properties['radius'] = feature.properties.radius;
          }
          this.drawnItems.addLayer(layer);
        });
      });
    }
  }

  addMarker(): void {
    const marker = this.createMarker();
    this.markersList.addLayer(marker);

    const markersGroup = L.featureGroup(this.markersList.getLayers()).addTo(this.myMap);
    this.myMap.panTo(marker.getLatLng());
    this.myMap.fitBounds(markersGroup.getBounds());

    this.latitudeControl.reset();
    this.longitudeControl.reset();
    this.ref.markForCheck();
  }

  save(): void {
    localStorage.setItem('drawn-items', JSON.stringify(this.drawnItems.toGeoJSON()));
  }

  private createMap(): DrawMap {
    return L.map(this.mapEl?.nativeElement)
      .setView(this.centerCoords, this.mapZoom)
      .on('click', () => {
        this.latitudeControl.reset();
        this.longitudeControl.reset();
      })
      .on('draw:created', (e: LeafletEvent) => {
        const createdEvent = e as L.DrawEvents.Created;
        const type = createdEvent.layerType;
        L.geoJson(createdEvent.layer.toGeoJSON(), {
          style: {
            color: this.drawPolygonColor,
            weight: this.drawPolygonWeight,
            opacity: 0.65,
          },

          pointToLayer: function (geoJsonPoint, latlng) {
            return type === 'circlemarker'
              ? new L.CircleMarker(latlng, { radius: 10 })
              : type === 'circle'
              ? new L.Circle(latlng, { radius: e.layer.getRadius() })
              : L.marker(latlng, {
                  icon: L.icon({
                    iconSize: [25, 41],
                    iconAnchor: [13, 41],
                    iconUrl: 'assets/marker-icon.png',
                    shadowUrl: 'assets/marker-shadow.png',
                  }),
                });
          },
        }).eachLayer((layer: any) => {
          layer.feature.properties['type'] = type;
          if (type === 'circlemarker' || type === 'circle') {
            layer.feature.properties['radius'] = e.layer.getRadius();
          }
          this.drawnItems.addLayer(layer);
        });

        this.ref.markForCheck();
      });
  }

  private createMarker(): Marker {
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
}
