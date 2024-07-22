<template>
  <div class="container-fluid">
    <div class="row gy-3">
      <div class="col-12">
        <div
          v-if="alertMessage"
          ref="alertBox"
          class="alert alert-danger alert-dismissible"
          role="alert"
        >
          {{ alertMessage }}
          <button
            type="button"
            class="btn-close"
            aria-label="Close"
            @click="alertMessage = null"
          />
        </div>
      </div>

      <div class="col-12">
        <div class="card">
          <div class="card-body">
            <h5 class="card-title">
              Information
            </h5>
            <div class="card-text">
              <table class="table">
                <tbody>
                  <tr>
                    <td>Date Created</td>
                    <td>{{ device.created }}</td>
                  </tr>
                  <tr>
                    <td>Last Updated</td>
                    <td>{{ device.updated }}</td>
                  </tr>
                  <tr>
                    <td>Data</td>
                    <td>
                      <ul>
                        <li
                          v-for="(value, name, i) in information.data"
                          :key="i"
                        >
                          {{ name }}:
                          <strong>{{ value }}</strong>
                        </li>
                      </ul>
                    </td>
                  </tr>
                  <tr>
                    <td>Current States</td>
                    <td>
                      <ul>
                        <li
                          v-for="currentState in currentStates"
                          :key="currentState.name"
                        >
                          {{ currentState.name }}:
                          <strong>{{ currentState.value }}</strong>
                        </li>
                      </ul>
                    </td>
                  </tr>
                  <tr>
                    <td>Events</td>
                    <td>
                      <a :href="`/devices/${device.id}/events`">List Events</a>
                    </td>
                  </tr>
                  <tr>
                    <td>In Use By</td>
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <div class="col-12">
        <div class="card">
          <div class="card-body">
            <h5 class="card-title">
              Commands
            </h5>
            <div class="card-text">
              <ul
                v-for="(command, i) in commands"
                :key="i"
              >
                <device-command
                  :device-id="device.id"
                  :command="command"
                />
              </ul>
            </div>
          </div>
        </div>
      </div>
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
                  @click="saveDevice"
                >
                  Save
                </button>
              </div>
              <div class="col-auto">
                <are-you-sure-dialog
                  title="Are you sure?"
                  body="Are you sure you want to delete this device?"
                  confirm-button="Delete"
                  @confirm-action="deleteDevice"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <generic-modal
      ref="deleteDeviceModal"
      title="Delete Device"
      :display-modal="deleteDeviceDisplayModal"
    >
      <template #content>
        <div v-if="displayForceDeleteDevice">
          The device does not appear to be responding
        </div>
        <div v-else>
          Deleting device, please wait...
        </div>
      </template>
      <template #buttonSlot>
        <button
          type="button"
          class="btn btn-danger"
          :disabled="!displayForceDeleteDevice"
          @click="forceDeleteDevice()"
        >
          Force Delete
        </button>
      </template>
      <template #cancelSlot>
        <button
          type="button"
          class="btn btn-secondary"
          @click="cancelDeleteDevice()"
        >
          Cancel
        </button>
      </template>
      <template #closeSlot />
    </generic-modal>
  </div>
</template>
<script>
import DeviceCommand from "@/components/device/DeviceCommand.vue";
import EnumInput from "@/components/device/DeviceEnumInput.vue";
import AreYouSureDialog from "@/components/common/AreYouSureDialog.vue";
import GenericModal from "@/components/common/GenericModal.vue";

export default {
  name: "DeviceView",
  components: {
    DeviceCommand,
    EnumInput,
    AreYouSureDialog,
    GenericModal,
  },
  data() {
    return {
      deviceId: "",
      device: {},
      deviceHandlers: {},
      dhFiltering: false,
      integrations: {},
      preferences: {},
      settings: {},
      commands: [],
      currentStates: {},
      information: {},
      deleteModal: null,
      deleteAreYouSure: true,
      deleteDeviceDisplayModal: false,
      displayForceDeleteDevice: false,
      alertMessage: null,
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
  mounted: function () {
    //this.deleteModal = new Modal(this.$refs.deviceDeleteModal);
    this.deviceId = this.$route.params.id;

    fetch(
      "/api/integrations?type=DEVICE&field=id&field=name&field=label&field=tags",
    )
      .then((response) => response.json())
      .then((data) => {
        if (data != null) {
          this.integrations = data;
          // add blank option
          this.integrations.push({ id: null, name: "None", label: "None" });
        }
      });

    fetch(`/api/devices/${this.deviceId}`)
      .then((response) => response.json())
      .then((data) => {
        if (data != null) {
          this.device = data;
        }
      });

    fetch(`/api/devices/${this.deviceId}/commands`)
      .then((response) => response.json())
      .then((data) => {
        if (data != null) {
          for (var cmd of data) {
            if (cmd.arguments) {
              for (var arg of cmd.arguments) {
                arg.value = null;
              }
            }
          }
          this.commands = data;
        }
      });

    fetch(`/api/devices/${this.deviceId}/states`)
      .then((response) => response.json())
      .then((data) => {
        if (data != null) {
          this.currentStates = data;
        }
      });

    fetch(`/api/devices/${this.deviceId}/information`)
      .then((response) => response.json())
      .then((data) => {
        if (data != null) {
          this.information = data;
        }
      });

    fetch(`/api/device-handlers?field=id&field=name&field=namespace&field=tags`)
      .then((response) => response.json())
      .then((data) => {
        if (data != null) {
          this.deviceHandlers = data;
        }
      });

    fetch(`/api/devices/${this.deviceId}/settings`)
      .then((response) => response.json())
      .then((data) => {
        if (data != null) {
          this.settings = data;
        }
      })
      .then(this.updatePreferenceLayout());

    let connection = new WebSocket(
      `ws://${window.location.host}/api/devices/${this.deviceId}/events`,
    );
    connection.onmessage = (event) => {
      var eventMap = JSON.parse(event.data);

      var matched = false;
      this.currentStates.forEach(function (item) {
        if (item.name == eventMap.name) {
          item.value = eventMap.value;
          matched = true;
        }
      });
      if (!matched) {
        this.currentStates.push({
          name: eventMap.name,
          value: eventMap.value,
        });
      }
    };
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
      fetch(`/api/devices/${this.deviceId}/preferences-layout`)
        .then((response) => {
          if (response) {
            return response.json();
          } else {
            return {};
          }
        })
        .then((data) => {
          this.preferences = data;
          if (data.sections) {
            for (var section of data.sections) {
              if (section.input != null) {
                for (var input of section.input) {
                  if (typeof this.settings[input.name] === "undefined") {
                    this.settings[input.name] = {
                      name: input.name,
                      valueAsType:
                        input.defaultValue == null ||
                        typeof input.defaultValue === "undefined"
                          ? null
                          : input.defaultValue,
                      type: input.type,
                      multiple: input.multiple ? true : false,
                    };
                  } else if (
                    this.settings[input.name].valueAsType == null &&
                    input.defaultValue != null
                  ) {
                    this.settings[input.name].valueAsType = input.defaultValue;
                  }
                }
              }
            }
          }
        });
    },
    saveDevice: function () {
      var body = { device: this.device, settings: this.settings };
      fetch(`/api/devices/${this.deviceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            this.updatePreferenceLayout();
          } else {
            console.log("problem saving device");
          }
        });
    },
    deleteDevice: function () {
      var vm = this;
      this.$refs.deleteDeviceModal.displayModal().then(() => {
        this.displayForceDeleteDevice = false;
        setTimeout(
          function () {
            vm.displayForceDeleteDevice = true;
          }.bind(this),
          20000,
        );
        fetch(`/api/devices/${this.deviceId}?poll=true`, { method: "DELETE" })
          .then((response) => response.json())
          .then((data) => {
            if (data.success) {
              this.$refs.deleteDeviceModal.hideModal();
              this.$router.push("/devices");
            } else {
              this.displayForceDeleteDevice = true;
            }
          });
      });
    },
    forceDeleteDevice: function () {
      this.displayForceDeleteDevice = false;
      fetch(`/api/devices/${this.deviceId}?poll=true&force=true`, {
        method: "DELETE",
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            this.$refs.deleteDeviceModal.hideModal();
            this.$router.push("/devices");
          } else {
            this.$refs.deleteDeviceModal.hideModal();
            this.alertMessage = "Unable to delete device";
            window.scrollTo(0, 0);
          }
        });
    },
    cancelDeleteDevice: function () {
      this.$refs.deleteDeviceModal.hideModal();
      this.displayForceDeleteDevice = false;
      fetch(`/api/devices/${this.deviceId}?cancel=true`, {
        method: "DELETE",
      });
    },
  },
};
</script>
<style scoped></style>
