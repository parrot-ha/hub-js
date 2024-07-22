<template>
  <div class="container-fluid">
    <div class="row gy-3">
      <div class="col-12">
        <div class="card">
          <div class="card-body">
            <h5 class="card-title">
              Information
            </h5>
            <div class="card-text">
              <form>
                <div class="mb-3">
                  <label
                    for="idInput"
                    class="form-label"
                  >ID</label>
                  <input
                    id="idInput"
                    v-model="installedSmartApp.id"
                    type="text"
                    class="form-control"
                    readonly
                  >
                </div>
                <div class="mb-3">
                  <label
                    for="labelInput"
                    class="form-label"
                  >Label</label>
                  <input
                    id="labelInput"
                    v-model="installedSmartApp.label"
                    type="text"
                    class="form-control"
                  >
                </div>
              </form>
            </div>

            <button
              type="button"
              class="btn btn-primary"
              @click="saveInstalledSmartApp"
            >
              Save
            </button>
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
              <table class="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Value</th>
                    <th>Type</th>
                    <th>Multiple</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="setting in installedSmartApp.settings"
                    :key="setting.id"
                  >
                    <td>{{ setting.name }}</td>
                    <td>{{ setting.value }}</td>
                    <td>{{ setting.type }}</td>
                    <td>{{ setting.multiple }}</td>
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
              Scheduled Jobs
            </h5>
            <div class="card-text">
              <table class="table">
                <thead>
                  <tr>
                    <th>Handler Method</th>
                    <th>Schedule</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(schedule, i) in schedules"
                    :key="i"
                  >
                    <td>{{ schedule.handlerMethod }}</td>
                    <td>{{ schedule.schedule }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <div class="col-12">
        <div class="row g-3">
          <div class="col-auto me-auto">
            <button
              type="button"
              class="btn btn-primary"
              @click="runUpdatedMethod"
            >
              Run Updated Method
            </button>
          </div>
          <div class="col-auto">
            <button
              type="button"
              class="btn btn-danger"
              data-bs-toggle="modal"
              data-bs-target="#uninstallModal"
            >
              Uninstall
            </button>
          </div>
        </div>
        <div
          id="uninstallModal"
          class="modal fade"
          tabindex="-1"
          aria-labelledby="uninstallModalLabel"
          aria-hidden="true"
        >
          <div class="modal-dialog">
            <div class="modal-content">
              <div class="modal-header">
                <h1
                  id="uninstallModalLabel"
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
                Are you sure you want to uninstall this Smart App?
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
                  @click="isaUninstallDialog"
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
</template>
<script>
function handleErrors(response) {
  if (!response.ok) {
    throw Error(response.statusText);
  }
  return response;
}

export default {
  name: "InstalledSmartAppInfo",
  data() {
    return {
      isaId: "",
      installedSmartApp: {},
      isaUninstallDialog: false,
      schedules: {},
    };
  },
  mounted: function () {
    this.isaId = this.$route.params.id;

    fetch(`/api/installed-smart-apps/${this.isaId}`)
      .then((response) => response.json())
      .then((data) => {
        if (typeof data !== "undefined" && data != null) {
          this.installedSmartApp = data;
        }
      });

    fetch(`/api/installed-smart-apps/${this.isaId}/schedules`)
      .then((response) => response.json())
      .then((data) => {
        if (typeof data !== "undefined" && data != null) {
          this.schedules = data;
        }
      });
  },
  methods: {
    saveInstalledSmartApp: function () {
      var body = this.installedSmartApp;
      fetch(`/api/installed-smart-apps/${this.isaId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            console.log("success");
          } else {
            console.log("problem saving installed smart app");
          }
        });
    },
    runUpdatedMethod: function () {
      var url = `/api/installed-smart-apps/${this.isaId}/methods/updated`;
      fetch(url, {
        method: "POST",
        body: null,
      })
        .then(handleErrors)
        .then(() => {});
    },
    uninstallClick: function () {
      fetch(`/api/installed-smart-apps/${this.isaId}`, {
        method: "DELETE",
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            this.$router.push("/isas");
          } else {
            console.log("problem deleting smart app");
          }
        });
    },
  },
};
</script>
<style scoped></style>
