<template>
  <div class="container-fluid">
    <div class="row">
      <div class="col">
        <div class="card">
          <h5 class="card-title" />
          <div class="card-body">
            <div class="card-text">
              <div class="d-flex gap-3">
                <router-link
                  class="btn btn-primary"
                  :to="{ name: 'LoggerConfig' }"
                >
                  Logger Configuration
                </router-link>
                <button
                  class="btn btn-primary"
                  @click="reloadSmartApps"
                >
                  Reload Smart Apps
                </button>
                <button
                  class="btn btn-primary"
                  @click="reloadDeviceHandlers"
                >
                  Reload Device Handlers
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
  name: "SettingsView",
  data() {
    return {};
  },
  methods: {
    reloadSmartApps: function () {
      var body = { action: "reload" };
      fetch("/api/settings/smart-apps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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
    reloadDeviceHandlers: function () {
      var body = { action: "reload" };
      fetch("/api/settings/device-handlers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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
  },
};
</script>
<style scoped></style>
