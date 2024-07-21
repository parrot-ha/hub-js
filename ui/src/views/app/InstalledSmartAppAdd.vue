<template>
  <div class="container-fluid">
    <div class="row">
      <div
        v-for="smartApp in smartApps"
        :key="smartApp.id"
        class="col-12"
      >
        <div class="card">
          <div class="card-body">
            <h5 class="card-title">
              {{ smartApp.name }} ({{ smartApp.namespace }})
            </h5>
            <div class="card-text">
              {{ smartApp.description }}
            </div>

            <button
              class="btn btn-primary"
              @click="addSmartApp(smartApp.id)"
            >
              Add
            </button>
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
  name: "InstalledSmartAppAdd",
  data() {
    return {
      smartApps: [],
    };
  },
  mounted: function () {
    fetch("/api/smart-apps")
      .then((response) => response.json())
      .then((data) => {
        if (typeof data !== "undefined" && data != null) {
          this.smartApps = data;
        }
      });
  },
  methods: {
    addSmartApp: function (id) {
      var body = { id: id };
      fetch("/api/installed-smart-apps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
        .then(handleErrors)
        .then((response) => {
          return response.json();
        })
        .then((data) => {
          console.log(JSON.stringify(data));
          this.$router.push(`/isas/${data.id}/cfg`);
        })
        .catch((error) => {
          console.log(error);
        });
    },
  },
};
</script>
<style scoped></style>
