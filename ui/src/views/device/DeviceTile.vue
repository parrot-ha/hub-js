<template>
  <div class="container-fluid">
    <div class="row">
      <div class="col-12">
        <div class="card">
          <h5 class="card-title">
            Settings
          </h5>
          <div class="card-text">
            <form>
              <v-text-field
                v-model="device.name"
                label="Name"
              />
              <v-text-field
                v-model="device.label"
                label="Label"
              />
              <v-text-field
                v-model="device.deviceNetworkId"
                label="Device Network ID"
              />
              <v-select
                v-model="device.deviceHandlerId"
                :items="deviceHandlers"
                :item-text="(item) => item.name + ' (' + item.namespace + ')'"
                item-value="id"
                label="Type"
              />
            </form>
          </div>
          <v-card-actions>
            <v-btn
              color="primary"
              @click="saveDevice"
            >
              Save
            </v-btn>
            <v-btn
              color="error"
              @click="deleteDevice"
            >
              Delete
            </v-btn>
          </v-card-actions>
        </div>
      </div>
      <div class="col-12">
        <div class="card">
          <h5 class="card-title">
            Information
          </h5>
          <div class="card-text">
            <v-simple-table>
              <tbody>
                <tr>
                  <td>Date Created</td>
                  <td />
                </tr>
                <tr>
                  <td>Last Updated</td>
                  <td />
                </tr>
                <tr>
                  <td>Data</td>
                  <td />
                </tr>
                <tr>
                  <td>Current States</td>
                  <td />
                </tr>
                <tr>
                  <td>Events</td>
                  <td>
                    <a :href="`/device/${device.id}/events`">List Events</a>
                  </td>
                </tr>
                <tr>
                  <td>In Use By</td>
                  <td />
                </tr>
              </tbody>
            </v-simple-table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  name: "DeviceShow",
  data() {
    return {
      device: {},
      deviceHandlers: {},
      preferences: {},
      settings: {},
      commands: [],
    };
  },
  mounted: function () {
    var deviceId = this.$route.params.id;

    fetch(`/api/devices/${deviceId}`)
      .then((response) => response.json())
      .then((data) => {
        if (typeof data !== "undefined" && data != null) {
          this.device = data;
        }
      });

    fetch(`/api/devices/${deviceId}/commands`)
      .then((response) => response.json())
      .then((data) => {
        if (typeof data !== "undefined" && data != null) {
          for (var cmd of data) {
            if (cmd.arguments) {
              cmd.values = [];
              for (var arg of cmd.arguments) {
                cmd.values.push({ name: arg, value: null });
              }
            }
          }
          this.commands = data;
        }
      });

    fetch(`/api/device-handlers?field=id&field=name&field=namespace`)
      .then((response) => response.json())
      .then((data) => {
        if (typeof data !== "undefined" && data != null) {
          this.deviceHandlers = data;
        }
      });
  },
};
</script>
<style scoped></style>
