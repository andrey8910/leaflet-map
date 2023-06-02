import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MarkerColor } from '../interfaces/marker-color';
import { DrawMap, Layer, LeafletEvent, Marker } from 'leaflet';
import * as L from 'leaflet';
import { LocalStorageService } from '../services/local-storage.service';
import { LocalStorageItems } from '../interfaces/local-storage-items';
import { Feature } from 'geojson';

@Component({
  selector: 'app-coords-markers',
  templateUrl: './coords-marker.component.html',
  styleUrls: ['./coords-marker.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoordsMarkerComponent implements OnInit {
  @Input() set colorList(value: MarkerColor[]) {
    this.listColor = value;
    this.markerColorControl.setValue(value[0]);
  }
  @Input() map!: DrawMap;

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
  constructor(private fb: FormBuilder, private ref: ChangeDetectorRef, private LSService: LocalStorageService) {}

  ngOnInit(): void {
    this.markersList.addTo(this.map);

    this.map
      .on('click', () => {
        this.latitudeControl.reset();
        this.longitudeControl.reset();
      })
      .on(L.Draw.Event.DELETED, (event: LeafletEvent) => {
        console.log(event);
      });

    if (this.LSService.getItem(LocalStorageItems.CoordsMarkers)) {
      const storageMarkers = this.LSService.getItem(LocalStorageItems.CoordsMarkers);
      const markersList = JSON.parse(storageMarkers);
      markersList.features.map((feature: Feature) => {
        L.geoJSON(feature, {
          pointToLayer(geoJsonPoint, latlng): Layer {
            return L.marker(latlng, {
              icon: L.divIcon({
                className: geoJsonPoint.properties.icon.options.className,
                iconAnchor: geoJsonPoint.properties.icon.options.iconAnchor,
                html: geoJsonPoint.properties.icon.options.html,
              }),
              draggable: true,
            });
          },
        }).eachLayer((marker: any) => {
          marker
            .on('drag', () => {
              this.latitudeControl.setValue(marker.getLatLng().lat);
              this.longitudeControl.setValue(marker.getLatLng().lng);
              this.saveMarkerChanges();
            })
            .on('click', () => {
              this.latitudeControl.setValue(marker.getLatLng().lat);
              this.longitudeControl.setValue(marker.getLatLng().lng);
            });
          //marker.edit = true;
          marker.feature.properties['icon'] = marker.getIcon();
          this.markersList.addLayer(marker);
        });
      });
      L.featureGroup(this.markersList.getLayers()).addTo(this.map);
    }
  }

  saveMarkerChanges(): void {
    this.LSService.setItem(LocalStorageItems.CoordsMarkers, this.markersList.toGeoJSON());
  }

  addMarker(): void {
    const marker = this.createMarker();

    L.geoJSON(marker.toGeoJSON(), {
      pointToLayer(geoJsonPoint, latlng): Layer {
        return L.marker(latlng, {
          icon: marker.getIcon(),
          draggable: true,
        });
      },
    }).eachLayer((layer: any) => {
      layer
        .on('drag', () => {
          this.latitudeControl.setValue(layer.getLatLng().lat);
          this.longitudeControl.setValue(layer.getLatLng().lng);
          this.saveMarkerChanges();
        })
        .on('click', () => {
          this.latitudeControl.setValue(layer.getLatLng().lat);
          this.longitudeControl.setValue(layer.getLatLng().lng);
        });
      layer.feature.properties['icon'] = layer.getIcon();
      this.markersList.addLayer(layer);
      console.log(this.markersList);
    });

    const markersGroup = L.featureGroup(this.markersList.getLayers()).addTo(this.map);
    this.map.panTo(marker.getLatLng());
    this.map.fitBounds(markersGroup.getBounds());

    this.latitudeControl.reset();
    this.longitudeControl.reset();

    this.saveMarkerChanges();
    this.ref.markForCheck();
  }

  private createMarker(): Marker {
    const markerIcon = L.divIcon({
      className: 'select-color-marker',
      iconAnchor: [0, 24],
      html: `<span style="background-color: ${this.markerColorControl.value.colorValue}"></span>`,
    });

    return L.marker([this.latitudeControl.value, this.longitudeControl.value], {
      title: 'marker',
      icon: markerIcon,
      draggable: true,
    });
  }
}
