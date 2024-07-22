<template>
  <div class="container">
    <div class="row">
      <div class="col">
        <h1>Edit Location</h1>
        <hr>
        <form>
          <div class="mb-3">
            <label
              for="nameInput"
              class="form-label"
            >Name</label>
            <input
              id="nameInput"
              v-model="location.name"
              type="text"
              class="form-control"
            >
          </div>

          <div class="mb-3">
            <label
              for="currentMode"
              class="form-label"
            >Current Mode</label>
            <select
              id="currentMode"
              v-model="location.currentMode.id"
              class="form-select"
              aria-label="Current Mode"
            >
              <option
                v-for="mode in location.modes"
                :key="mode.id"
                :value="mode.id"
              >
                {{ mode.name }}
              </option>
            </select>
          </div>

          <div class="mb-3">
            <label
              for="temperatureScale"
              class="form-label"
            >Temperature Scale</label>
            <select
              id="temperatureScale"
              v-model="location.temperatureScale"
              class="form-select"
              aria-label="Temperature Scale"
            >
              <option>C</option>
              <option>F</option>
            </select>
          </div>

          <div class="mb-3">
            <label
              for="zipCode"
              class="form-label"
            >ZIP Code</label>
            <input
              id="zipCode"
              v-model="location.zipCode"
              type="text"
              class="form-control"
            >
          </div>

          <div class="mb-3">
            <label
              for="latitude"
              class="form-label"
            >Latitude</label>
            <input
              id="latitude"
              v-model="location.latitude"
              type="text"
              class="form-control"
            >
          </div>

          <div class="mb-3">
            <label
              for="longitude"
              class="form-label"
            >Longitude</label>
            <input
              id="longitude"
              v-model="location.longitude"
              type="text"
              class="form-control"
            >
          </div>

          <div class="row g-2">
            <div class="col-6">
              <button
                type="button"
                class="btn btn-primary mb-3"
                @click="saveLocation"
              >
                Save
              </button>
            </div>
            <div class="col-6">
              <button
                type="button"
                class="btn btn-danger mb-3"
                @click="loadLocationData"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      </div>
      <div class="col">
        <div
          id="map"
          style="width: 100%; height: 580px"
        />
      </div>
    </div>
  </div>
</template>
<script>
import _debounce from "lodash/debounce";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

L.Icon.Default.imagePath = "/img/leaflet/";

export default {
  name: "LocationView",
  data() {
    return {
      location: {
        currentMode: {},
      },
      map: null,
      marker: null,
    };
  },
  watch: {
    "location.latitude": function () {
      this.debouncedUpdateMap();
    },
    "location.longitude": function () {
      this.debouncedUpdateMap();
    },
  },
  created: function () {
    this.debouncedUpdateMap = _debounce(this.updateMap, 500);
  },
  mounted: function () {
    this.loadLocationData();
    //fetch('/api/location')
    //  .then(response => response.json())
    //  .then(data => {
    //    if (typeof data !== 'undefined' && data != null) {
    //      this.location = data;
    //    }
    //  });
  },
  methods: {
    saveLocation: function () {
      fetch("/api/location", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(this.location),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            //TODO: put message on ui
            console.log("saved location");
          } else {
            console.log("problem saving location");
          }
        });
    },
    loadLocationData: function () {
      fetch("/api/location")
        .then((response) => response.json())
        .then((data) => {
          if (typeof data !== "undefined" && data != null) {
            this.location = data;
          }
        });
    },
    setupLeafletMap: function () {
      var vm = this;
      var latlng = L.latLng(
        vm.safeLatLng(vm.location.latitude),
        vm.safeLatLng(vm.location.longitude),
      );
      vm.map = L.map("map").setView(latlng, 17);
      L.tileLayer("http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
      }).addTo(this.map);
      vm.marker = L.marker(latlng, { draggable: true }).addTo(vm.map);

      vm.marker.on("moveend", function (e) {
        vm.location.latitude = e.target.getLatLng().lat;
        vm.location.longitude = e.target.getLatLng().lng;
      });
    },
    safeLatLng: function (val) {
      if (typeof val === "undefined" || val == null) return 0;
      return val;
    },
    updateMap: function () {
      var vm = this;
      if (vm.map == null) {
        vm.setupLeafletMap();
      } else {
        var latlng = vm.map.getCenter();
        var changed = false;
        if (latlng.lat != vm.location.latitude) {
          latlng.lat = vm.location.latitude;
          changed = true;
        }
        if (latlng.lng != vm.location.longitude) {
          latlng.lng = vm.location.longitude;
          changed = true;
        }
        if (changed) {
          vm.map.setView(latlng);
          vm.marker.setLatLng(latlng);
        }
      }
    },
  },
};
</script>
<style scoped></style>
