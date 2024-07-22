<template>
  <div class="container-fluid">
    <div class="row gy-3">
      <div class="col-12">
        <div class="card">
          <div class="card-body">
            <h5 class="card-title">
              Settings
            </h5>
            <div class="card-text">
              <form>
                <div class="mb-3">
                  <label
                    for="nameInput"
                    class="form-label"
                  >Name</label>
                  <input
                    id="nameInput"
                    v-model="device.name"
                    type="text"
                    class="form-control"
                  >
                </div>
                <div class="mb-3">
                  <label
                    for="labelInput"
                    class="form-label"
                  >Label</label>
                  <input
                    id="labelInput"
                    v-model="device.label"
                    type="text"
                    class="form-control"
                  >
                </div>
                <div class="mb-3">
                  <label
                    for="deviceNetworkIdInput"
                    class="form-label"
                  >Device Network ID</label>
                  <input
                    id="deviceNetworkIdInput"
                    v-model="device.deviceNetworkId"
                    type="text"
                    class="form-control"
                  >
                </div>

                <div class="mb-3">
                  <label class="form-label">Integration</label>
                  <select
                    v-model="device.integrationId"
                    class="form-select"
                    aria-label="Integration"
                  >
                    <option
                      v-for="integration in integrations"
                      :key="integration.id"
                      :value="integration.id"
                    >
                      {{ integration.name }}
                    </option>
                  </select>
                </div>
                <div class="mb-3">
                  <label class="form-label">Type</label>

                  <div class="input-group mb-3">
                    <button
                      class="btn btn-outline-secondary css-tooltip"
                      type="button"
                      data-tooltip="Filter type based on selected integration"
                      @click="dhFiltering = !dhFiltering"
                    >
                      <span
                        :class="dhFiltering ? 'bi-funnel-fill' : 'bi-funnel'"
                      />
                    </button>
                    <select
                      v-model="device.deviceHandlerId"
                      class="form-select"
                      aria-label="Type"
                    >
                      <option
                        v-for="dth in filteredDevices"
                        :key="dth.id"
                        :value="dth.id"
                      >
                        {{ dth.name }} ({{ dth.namespace }})
                      </option>
                    </select>
                  </div>
                </div>
              </form>

              <hr>
              <h5 class="card-title">
                Preferences
              </h5>
              <form>
                <div
                  v-for="(section, i) in preferences.sections"
                  :key="i"
                >
                  <div
                    v-for="(body, j) in section.body"
                    :key="j"
                  >
                    <div
                      v-if="body.type === 'bool'"
                      class="form-check form-switch mb-3"
                    >
                      <input
                        v-model="settings[body.name].value"
                        class="form-check-input"
                        type="checkbox"
                        role="switch"
                      >
                      <label class="form-check-label">{{ body.title }}</label>
                    </div>
                    <div
                      v-if="body.type === 'decimal'"
                      class="mb-3"
                    >
                      <label class="form-label">{{ body.title }}</label>
                      <input
                        v-model="settings[body.name].value"
                        type="number"
                        step="any"
                        class="form-control"
                      >
                    </div>

                    <div v-if="body.type === 'email'">
                      <label class="form-label">{{ body.title }}</label>
                      <input
                        v-model="settings[body.name].value"
                        type="email"
                        class="form-control"
                      >
                    </div>
                    <div v-if="body.type === 'enum'">
                      <enum-input
                        v-if="settings[body.name]"
                        v-model="settings[body.name].value"
                        :options="body.options"
                        :body="body"
                      />
                    </div>
                    <div v-if="body.type === 'number'">
                      <label class="form-label">{{ body.title }}</label>
                      <input
                        v-model="settings[body.name].value"
                        type="number"
                        step="1"
                        class="form-control"
                      >
                    </div>
                    <div v-if="body.type === 'password'">
                      <label class="form-label">{{ body.title }}</label>
                      <input
                        v-model="settings[body.name].value"
                        type="password"
                        class="form-control"
                      >
                    </div>
                    <div v-if="body.type === 'phone'">
                      <label class="form-label">{{ body.title }}</label>
                      <input
                        v-model="settings[body.name].value"
                        type="tel"
                        class="form-control"
                      >
                    </div>
                    <div v-if="body.type === 'time'">
                      <label class="form-label">{{ body.title }}</label>
                      <input
                        v-model="settings[body.name].value"
                        type="time"
                        class="form-control"
                      >
                    </div>
                    <div v-if="body.type === 'text' || body.type === 'string'">
                      <div class="mb-3">
                        <label class="form-label">{{ body.title }}</label>
                        <input
                          v-model="settings[body.name].value"
                          type="text"
                          class="form-control"
                        >
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>
            <div class="row g-3">
              <div class="col-auto me-auto">
                <button
                  type="button"
                  class="btn btn-primary"
                  @click="addDevice"
                >
                  Add
                </button>
              </div>
              <div class="col-auto">
                <router-link
                  class="btn btn-danger"
                  :to="{ name: 'Devices' }"
                >
                  Cancel
                </router-link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import EnumInput from "@/components/device/DeviceEnumInput.vue";

export default {
  name: "DeviceAdd",
  components: {
    EnumInput,
  },
  data() {
    return {
      device: { name: "", label: "", deviceNetworkId: "", deviceHandlerId: "" },
      dhFiltering: false,
      deviceHandlers: {},
      integrations: {},
      preferences: {},
      settings: {},
    };
  },
  computed: {
    filteredDevices: function () {
      if (this.dhFiltering && this.device.integrationId != null) {
        var integration = this.integrations.find(
          (i) => i.id == this.device.integrationId,
        );
        if (integration.tags != null) {
          return this.sortDeviceHandlers(this.deviceHandlers).filter(
            (dh) =>
              (dh.tags != null &&
                integration.tags.some((t) => dh.tags.indexOf(t) >= 0)) ||
              this.device.deviceHandlerId == dh.id,
          );
        } else {
          return this.sortDeviceHandlers(this.deviceHandlers);
        }
      } else {
        return this.sortDeviceHandlers(this.deviceHandlers);
      }
    },
  },
  watch: {
    "device.deviceHandlerId": function () {
      this.updatePreferenceLayout();
    },
  },
  mounted: function () {
    fetch(
      "/api/integrations?type=DEVICE&field=id&field=name&field=label&field=tags",
    )
      .then((response) => response.json())
      .then((data) => {
        if (typeof data !== "undefined" && data != null) {
          this.integrations = data;
          // add blank option
          this.integrations.push({ id: null, name: "None", label: "None" });
        }
      });

    fetch(`/api/device-handlers?field=id&field=name&field=namespace&field=tags`)
      .then((response) => response.json())
      .then((data) => {
        if (typeof data !== "undefined" && data != null) {
          this.deviceHandlers = data;
        }
      });
  },
  methods: {
    sortDeviceHandlers: function (unsortedDeviceHandlers) {
      if (unsortedDeviceHandlers != null && unsortedDeviceHandlers.length > 0) {
        let sortedDeviceHandlers = [...unsortedDeviceHandlers].sort((a, b) => {
          const nameA = a.name.toUpperCase();
          const nameB = b.name.toUpperCase();
          if (nameA < nameB) {
            return -1;
          }
          if (nameA > nameB) {
            return 1;
          }

          return 0;
        });
        return sortedDeviceHandlers;
      } else {
        return unsortedDeviceHandlers;
      }
    },
    updatePreferenceLayout: function () {
      // TODO: validate the deviceHandlerId value is valid before calling
      fetch(
        `/api/device-handlers/${this.device.deviceHandlerId}/preferences-layout`,
      )
        .then((response) => {
          if (response) {
            return response.json();
          } else {
            return {};
          }
        })
        .then((data) => {
          this.preferences = data;
          this.settings = {};
          if (data.sections) {
            for (var section of data.sections) {
              for (var input of section.input) {
                if (typeof this.settings[input.name] === "undefined") {
                  //TODO: is empty string ok, or should it be null?
                  this.settings[input.name] = {
                    name: input.name,
                    value: null,
                    type: input.type,
                    multiple: input.multiple ? true : false,
                  };
                }
              }
            }
          }
        });
    },
    addDevice: function () {
      var body = { device: this.device, settings: this.settings };
      console.log(JSON.stringify(body));

      fetch(`/api/devices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            console.log("success " + data.deviceId);
            this.$router.push(`/devices/${data.deviceId}`);
          } else {
            console.log("problem adding device");
          }
        });
    },
  },
};
</script>
<style scoped></style>
