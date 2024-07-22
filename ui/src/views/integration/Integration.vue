<template>
  <div class="container-fluid">
    <div class="row gy-3">
      <div class="col-12">
        <h2>{{ integration.label }} ({{ integration.name }})</h2>

        <div class="card">
          <div class="card-body">
            <h5 class="card-title">
              Information
            </h5>
            <div class="card-text">
              <table class="table">
                <tbody>
                  <tr
                    v-for="(value, name, infCount) in integration.information"
                    :key="infCount"
                  >
                    <td>{{ name }}</td>
                    <td>{{ value }}</td>
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
              Settings
            </h5>
            <div class="card-text">
              <form>
                <div class="mb-3">
                  <label
                    for="labelInput"
                    class="form-label"
                  >Label</label>
                  <input
                    id="labelInput"
                    v-model="integration.label"
                    type="text"
                    class="form-control"
                  >
                </div>
                <hr>
                <div
                  v-for="(section, i) in preferences.sections"
                  :key="i"
                >
                  <div
                    v-for="(body, j) in section.body"
                    :key="j"
                  >
                    <div
                      v-if="body.type === 'text'"
                      class="mb-3"
                    >
                      <label class="form-label">{{ body.title }}</label>
                      <input
                        v-model="settings[body.name].value"
                        type="text"
                        class="form-control"
                      >
                    </div>
                    <div
                      v-else-if="body.type === 'enum'"
                      class="mb-3"
                    >
                      <label class="form-label">{{ body.title }}</label>
                      <select
                        v-model="settings[body.name].value"
                        class="form-select"
                        :aria-label="body.title"
                        :multiple="body.multiple"
                      >
                        <option
                          v-for="(item, optCount) in body.options"
                          :key="optCount"
                        >
                          {{ item }}
                        </option>
                      </select>
                    </div>
                    <div
                      v-else-if="body.type === 'bool'"
                      class="mb-3"
                    >
                      <input
                        v-model="settings[body.name].value"
                        class="form-check-input"
                        type="checkbox"
                        role="switch"
                      >
                      <label class="form-check-label">{{ body.title }}</label>
                    </div>
                  </div>
                </div>
              </form>
              <div class="d-flex gap-3">
                <button
                  class="btn btn-primary"
                  @click="saveIntegration"
                >
                  Save
                </button>
                <button
                  type="button"
                  class="btn btn-danger"
                  data-bs-toggle="modal"
                  data-bs-target="#deleteModal"
                >
                  Delete
                </button>
              </div>
              <div
                id="deleteModal"
                class="modal fade"
                tabindex="-1"
                aria-labelledby="deleteModalLabel"
                aria-hidden="true"
              >
                <div class="modal-dialog">
                  <div class="modal-content">
                    <div class="modal-header">
                      <h1
                        id="deleteModalLabel"
                        class="modal-title fs-5"
                      >
                        Are you sure?
                      </h1>
                      <button
                        type="button"
                        class="btn-close"
                        data-bs-dismiss="modal"
                        aria-label="Close"
                      />
                    </div>
                    <div class="modal-body">
                      Are you sure you want to delete this integration?
                    </div>
                    <div class="modal-footer">
                      <button
                        type="button"
                        class="btn btn-secondary"
                        data-bs-dismiss="modal"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        class="btn btn-danger"
                        @click="deleteIntegration"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        v-for="(section, i) in pageLayout"
        :key="i"
        class="col-12"
      >
        <div class="card">
          <div class="card-body">
            <h5 class="card-title">
              {{ section.title }}
            </h5>
            <div class="card-text">
              <div
                v-for="(bodyItem, j) in section.body"
                :key="j"
              >
                <div v-if="bodyItem.type === 'table'">
                  <table>
                    <thead>
                      <tr>
                        <th
                          v-for="column in bodyItem.columns"
                          :key="column.data"
                        >
                          {{ column.title }}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="(dataRow, k) in pageData[bodyItem.data]"
                        :key="k"
                      >
                        <td
                          v-for="column in bodyItem.columns"
                          :key="column.data"
                        >
                          {{ dataRow[column.data] }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div v-if="bodyItem.type === 'button'">
                  <button
                    :class="'btn btn-' + bodyItem.color"
                    :disabled="pageData[bodyItem.disabled]"
                    @click="
                      handleButtonAction(bodyItem.action, bodyItem.response)
                    "
                  >
                    {{ bodyItem.title }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="featureExists('deviceScan')"
        class="col-12"
      >
        <div class="card">
          <div class="card-body">
            <div class="card-title">
              Device Scanning
              <span
                v-show="scanDevicesRunning"
                class="spinner-border"
              />
            </div>
            <div class="card-text">
              <div id="foundDeviceDiv">
                {{ foundDevices }}
              </div>
              <div class="d-flex gap-3">
                <button
                  class="btn btn-success"
                  :disabled="scanDevicesRunning"
                  @click="startScan"
                >
                  Start Scan
                </button>
                <button
                  class="btn btn-danger"
                  :disabled="!scanDevicesRunning"
                  @click="stopScan"
                >
                  Stop Scan
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="featureExists('deviceExclude')"
        class="col-12"
      >
        <div class="card">
          <div class="card-body">
            <div class="card-title">
              Device Exclude
              <span
                v-show="excludeDevicesRunning"
                class="spinner-border"
              />
            </div>
            <div class="card-text">
              <div id="deviceExcludedDiv">
                {{ excludedDevices }}
              </div>
              <div class="d-flex gap-3">
                <button
                  class="btn btn-success"
                  :disabled="excludeDevicesRunning"
                  @click="startExclude"
                >
                  Start Exclude
                </button>
                <button
                  class="btn btn-danger"
                  :disabled="!excludeDevicesRunning"
                  @click="stopExclude"
                >
                  Stop Exclude
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="featureExists('reset')"
        class="col-12"
      >
        <div class="card">
          <div class="card-body">
            <h5 class="card-title">
              Reset
            </h5>
            <div class="card-text">
              <h5 style="color: red">
                {{ getFeatureOption("reset", "resetWarning") }}
              </h5>
              <form>
                <div class="mb-3">
                  <label
                    for="resetInput"
                    class="form-label"
                  >Type "reset" and click Reset button to reset</label>
                  <input
                    id="resetInput"
                    v-model="reset"
                    type="text"
                    class="form-control"
                  >
                </div>
              </form>
              <button
                class="btn btn-danger"
                @click="resetIntegration"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
function handleErrors(response) {
  if (!response.ok) {
    throw Error(response.statusText);
  }
  return response;
}

export default {
  name: "IntegrationView",
  data() {
    return {
      integrationId: "",
      integration: {
        settings: {},
      },
      settings: {},
      preferences: {},
      pageLayout: [],
      pageData: {},
      foundDevices: null,
      scanDevicesRunning: false,
      excludedDevices: null,
      excludeDevicesRunning: false,
      reset: "",
      integrationDeleteDialog: false,
    };
  },
  mounted: function () {
    this.integrationId = this.$route.params.id;

    fetch(`/api/integrations/${this.integrationId}`)
      .then((response) => response.json())
      .then((data) => {
        if (typeof data !== "undefined" && data != null) {
          this.integration = data;
          if (this.settings == null) {
            this.settings = {};
          }
        }
      });

    fetch(`/api/integrations/${this.integrationId}/settings`)
      .then((response) => response.json())
      .then((data) => {
        if (typeof data !== "undefined" && data != null) {
          this.settings = data;
        }
      })
      .then(this.loadPreferencesLayout());

    fetch(`/api/integrations/${this.integrationId}/page-data`)
      .then((response) => response.json())
      .then((data) => {
        if (typeof data !== "undefined" && data != null) {
          this.pageData = data;
        }
      })
      .then(this.loadPageLayout());
  },
  methods: {
    handleButtonAction: function (action, responseIndex) {
      console.log(
        "handleButtonAction " + action + " response " + responseIndex,
      );

      fetch(`/api/integrations/${this.integrationId}/button-action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: action }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (typeof data !== "undefined" && data != null) {
            this.pageData[responseIndex] = data.responseData;
          }
        });
    },
    deleteIntegration: function () {
      fetch(`/api/integrations/${this.integrationId}`, {
        method: "DELETE",
      })
        .then(handleErrors)
        .then((response) => {
          return response.json();
        })
        .then(() => {
          console.log("integration was deleted!");
          this.$router.push("/integrations");
        })
        .catch((error) => {
          console.log(error);
        });
    },
    saveIntegration: function () {
      var updatedSettings = this.settings;
      updatedSettings.label = { value: this.integration.label };
      fetch(`/api/integrations/${this.integrationId}/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedSettings),
      })
        .then(handleErrors)
        .then((response) => {
          return response.json();
        })
        .then(() => {
          console.log("success");
        })
        .catch((error) => {
          console.log(error);
        });
    },

    featureExists: function (value) {
      if (this.integration == null || typeof this.integration === "undefined")
        return false;
      if (
        this.integration.features == null ||
        typeof this.integration.features === "undefined"
      )
        return false;
      for (const property in this.integration.features) {
        if (property == value) return true;
      }
      return false;
    },
    getFeatureOption: function (featureName, optionName) {
      if (this.integration == null || typeof this.integration === "undefined")
        return "";
      if (
        this.integration.features == null ||
        typeof this.integration.features === "undefined"
      )
        return "";
      if (
        this.integration.features[featureName] == null ||
        typeof this.integration.features[featureName] === "undefined"
      )
        return "";
      return this.integration.features[featureName][optionName];
    },
    checkStatus: function () {
      var vm = this;
      var body = { action: "getScanStatus" };
      fetch(`/api/integrations/${vm.integrationId}/features/deviceScan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
        .then((response) => response.json())
        .then((data) => {
          vm.scanDevicesRunning = data.response.running;
          vm.foundDevices = data.response.foundDevices;
          if (data.response.running) {
            setTimeout(
              function () {
                this.checkStatus();
              }.bind(this),
              2000,
            );
          }
        });
    },
    startScan: function () {
      var vm = this;
      var body = { action: "startScan" };
      fetch(`/api/integrations/${vm.integrationId}/features/deviceScan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
        .then((response) => response.json())
        .then(() => {
          vm.scanDevicesRunning = true;
          // check status
          setTimeout(
            function () {
              this.checkStatus();
            }.bind(this),
            2000,
          );
        });
    },
    stopScan: function () {
      var vm = this;
      var body = { action: "stopScan" };
      fetch(`/api/integrations/${vm.integrationId}/features/deviceScan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
        .then((response) => response.json())
        .then(() => {
          vm.checkStatus();
        });
    },
    checkExcludeStatus: function () {
      var vm = this;
      var body = { action: "getExcludeStatus" };
      fetch(`/api/integrations/${vm.integrationId}/features/deviceExclude`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
        .then((response) => response.json())
        .then((data) => {
          vm.excludeDevicesRunning = data.response.running;
          vm.excludedDevices = data.response.excludedDevices;
          if (data.response.running) {
            setTimeout(
              function () {
                this.checkExcludeStatus();
              }.bind(this),
              2000,
            );
          }
        });
    },
    startExclude: function () {
      var vm = this;
      var body = { action: "startExclude" };
      fetch(`/api/integrations/${vm.integrationId}/features/deviceExclude`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
        .then((response) => response.json())
        .then(() => {
          vm.excludeDevicesRunning = true;
          // check status
          setTimeout(
            function () {
              this.checkExcludeStatus();
            }.bind(this),
            2000,
          );
        });
    },
    stopExclude: function () {
      var vm = this;
      var body = { action: "stopExclude" };
      fetch(`/api/integrations/${vm.integrationId}/features/deviceExclude`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
        .then((response) => response.json())
        .then(() => {
          vm.checkExcludeStatus();
        });
    },
    resetIntegration: function () {
      var vm = this;
      if (vm.reset === "reset") {
        var body = { action: "reset" };
        fetch(`/api/integrations/${vm.integrationId}/features/reset`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
          .then((response) => response.json())
          .then(() => {
            vm.checkStatus();
          });
      } else {
        //TODO: display this to the user instead of just in the console.
        console.log("Please type reset into text box");
      }
    },
    loadPreferencesLayout: function () {
      fetch(`/api/integrations/${this.integrationId}/preferences-layout`)
        .then((response) => response.json())
        .then((data) => {
          this.preferences = data;
          for (var section of data.sections) {
            for (var input of section.input) {
              if (typeof this.settings[input.name] === "undefined") {
                //TODO: is empty string ok, or should it be null?
                this.settings[input.name] = {
                  name: input.name,
                  value: input.multiple ? [] : null,
                  type: input.type,
                  multiple: input.multiple,
                };
              } else {
                // check if multiple changed
                if (this.settings[input.name].multiple != input.multiple) {
                  // update setting
                  this.settings[input.name].multiple = input.multiple;
                  // we are changing to true, check value
                  if (input.multiple) {
                    if (
                      this.settings[input.name].value === null ||
                      this.settings[input.name].value === ""
                    ) {
                      this.settings[input.name].value = [];
                    } else if (
                      !Array.isArray(this.settings[input.name].value)
                    ) {
                      this.settings[input.name].value = Array.from(
                        this.settings[input.name].value,
                      );
                    }
                  }
                  //TODO: handle multiple going from true to false
                }
              }
            }
          }
        });
    },
    loadPageLayout: function () {
      fetch(`/api/integrations/${this.integrationId}/page-layout`)
        .then((response) => response.json())
        .then((data) => {
          this.pageLayout = data;
        });
    },
  },
};
</script>
<style scoped></style>
