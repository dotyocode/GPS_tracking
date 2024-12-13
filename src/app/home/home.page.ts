import { Component, OnDestroy, OnInit } from '@angular/core';
import { Geolocation } from '@capacitor/geolocation';
import * as L from 'leaflet';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit, OnDestroy {
  map: L.Map | undefined;
  route: L.Polyline | undefined;
  coordinates: L.LatLng[] = [];
  isTracking: boolean = false;
  watchId: string | undefined;

  ngOnInit() {
    this.initMap();
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
    }
    if (this.watchId) {
      Geolocation.clearWatch({ id: this.watchId });
    }
  }

  initMap() {
    setTimeout(() => {
      const mapElement = document.getElementById('map');
      if (!mapElement) {
        console.error('Elemento #map não encontrado!');
        return;
      }

      this.map = L.map(mapElement).setView([0, 0], 15);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(this.map);

      console.log('Mapa inicializado com sucesso!');

      this.getCurrentLocation();
    }, 0);
  }

  async getCurrentLocation() {
    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
      });
      console.log('Posição atual:', position);

      const latLng = L.latLng(
        position.coords.latitude,
        position.coords.longitude
      );

      if (this.map) {
        this.map.setView(latLng, 15);
        L.marker(latLng)
          .addTo(this.map)
          .bindPopup('Você está aqui')
          .openPopup();
      }
    } catch (err) {
      console.error('Erro ao obter localização atual:', err);
    }
  }

  async startTracking() {
    this.isTracking = true;
    this.coordinates = [];
    this.route = L.polyline([], { color: 'blue' }).addTo(this.map!);

    this.watchId = await Geolocation.watchPosition(
      { enableHighAccuracy: true },
      (position, err) => {
        if (err) {
          console.error('Erro ao rastrear localização:', err);
          return;
        }

        console.log('Nova posição rastreada:', position);

        if (position) {
          const latLng = L.latLng(
            position.coords.latitude,
            position.coords.longitude
          );
          this.coordinates.push(latLng);

          this.route?.addLatLng(latLng);
          this.map?.setView(latLng, 15);
        }
      }
    );
  }

  async stopTracking() {
    this.isTracking = false;
    if (this.watchId) {
      await Geolocation.clearWatch({ id: this.watchId });
    }
    this.saveRoute();
  }

  saveRoute() {
    const routeData = this.coordinates.map((coord) => ({
      lat: coord.lat,
      lng: coord.lng,
    }));

    console.log('Rota salva:', routeData);
  }
}
