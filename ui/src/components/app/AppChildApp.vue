<template>
  <div>
    <div
      v-if="body.multiple"
      class="d-grid"
    >
      <div
        v-for="childApp in childApps"
        :key="childApp.id"
        class="d-grid"
      >
        <button
          class="btn btn-light"
          @click="onChildNav(childApp.id)"
        >
          {{ childApp.displayName }}
        </button>
      </div>
      <button
        class="btn btn-light"
        @click="onAddChild(body.namespace, body.appName)"
      >
        {{ body.title }}
      </button>
    </div>
    <div
      v-else
      class="d-grid"
    >
      <button
        class="btn btn-light"
        @click="onAddChild(body.namespace, body.appName)"
      >
        {{ body.title }}
      </button>
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
  name: "AppChildApp",
  props: ["body"],
  data() {
    return {
      isaId: "",
      childApps: {},
    };
  },
  mounted: function () {
    this.isaId = this.$route.params.id;

    // get child apps
    fetch(
      `/api/installed-smart-apps/${this.isaId}/child-apps?appName=${this.body.appName}&namespace=${this.body.namespace}`,
    )
      .then((response) => response.json())
      .then((data) => {
        if (typeof data !== "undefined" && data != null) {
          this.childApps = data;
        }
      });
  },
  methods: {
    onChildNav: function (childAppid) {
      this.$router.push({
        name: "InstalledSmartAppConfig",
        params: { id: childAppid },
      });
    },
    onAddChild: function (namespace, appName) {
      var body = {
        id: this.isaId,
        type: "child",
        appName: appName,
        namespace: namespace,
      };
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
          //this.$router.push(`/isas/${data.id}/cfg`);
          this.$router.push({
            name: "InstalledSmartAppConfig",
            params: { id: data.id },
          });
        })
        .catch((error) => {
          console.log(error);
        });
    },
  },
};
</script>

<style scoped></style>
