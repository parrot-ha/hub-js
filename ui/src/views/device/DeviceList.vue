<template>
  <div class="container-fluid">
    <div class="row">
      <div class="col">
        <div class="card">
          <div class="card-body">
            <div
              class="card-title d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3"
            >
              <h5>Devices</h5>
              <div class="btn-toolbar mb-2 mb-md-0">
                <router-link
                  class="btn btn-outline-secondary"
                  :to="{ name: 'DeviceAdd' }"
                >
                  Add Device
                </router-link>
              </div>
            </div>
            <div class="card-text">
              <table class="table">
                <thead>
                  <tr>
                    <th scope="col" />
                    <th scope="col">
                      Display Name
                    </th>
                    <th scope="col">
                      Type
                    </th>
                    <th scope="col">
                      Device Network ID
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="device in sortedDevices"
                    :key="device.id"
                  >
                    <td>
                      <router-link
                        :to="{
                          name: 'DeviceConfig',
                          params: { id: device.id },
                        }"
                      >
                        <i class="bi bi-exclamation-circle" />
                      </router-link>
                    </td>
                    <td>
                      <router-link
                        :to="{ name: 'device', params: { id: device.id } }"
                      >
                        {{ device.displayName }}
                      </router-link>
                    </td>
                    <td>{{ device.type }}</td>
                    <td>{{ device.deviceNetworkId }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  name: "DevicesView",
  data() {
    return {
      devices: [],
    };
  },
  computed: {
    sortedDevices() {
      let sortedDevices = [...this.devices].sort((a, b) => {
        const nameA = a.displayName.toUpperCase(); // ignore upper and lowercase
        const nameB = b.displayName.toUpperCase(); // ignore upper and lowercase
        if (nameA < nameB) {
          return -1;
        }
        if (nameA > nameB) {
          return 1;
        }

        // names must be equal
        return 0;
      });
      return sortedDevices;
    },
  },
  mounted: function () {
    fetch("/api/devices")
      .then((response) => response.json())
      .then((data) => {
        if (typeof data !== "undefined" && data != null) {
          this.devices = data;
        }
      });
  },
};
</script>
<style scoped></style>
