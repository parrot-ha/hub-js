<template>
  <div class="container-fluid">
    <div class="row">
      <div class="col">
        <div class="card">
          <div class="card-body">
            <div
              class="card-title d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3"
            >
              <h5>Installed Smart Apps</h5>
              <div class="btn-toolbar mb-2 mb-md-0">
                <router-link
                  class="btn btn-outline-secondary"
                  :to="{ name: 'InstalledSmartAppAdd' }"
                >
                  Add Smart App
                </router-link>
              </div>
            </div>

            <div class="card-text">
              <table class="table">
                <thead>
                  <tr>
                    <th scope="col" />
                    <th scope="col">
                      Label
                    </th>
                    <th scope="col">
                      Type
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="isa in sortedInstalledSmartApps"
                    :key="isa.id"
                  >
                    <td>
                      <router-link
                        :to="{
                          name: 'InstalledSmartAppInfo',
                          params: { id: isa.id },
                        }"
                      >
                        <i class="bi bi-exclamation-circle" />
                      </router-link>
                    </td>
                    <td>
                      <router-link
                        :to="{
                          name: 'InstalledSmartAppConfig',
                          params: { id: isa.id },
                        }"
                      >
                        {{ isa.label }}
                      </router-link>
                    </td>
                    <td>{{ isa.type }}</td>
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
  name: "InstalledSmartAppList",
  data() {
    return {
      installedSmartApps: [],
    };
  },
  computed: {
    sortedInstalledSmartApps() {
      let sortedInstalledSmartApps = [...this.installedSmartApps].sort(
        (a, b) => {
          const nameA = a.label.toUpperCase();
          const nameB = b.label.toUpperCase();
          if (nameA < nameB) {
            return -1;
          }
          if (nameA > nameB) {
            return 1;
          }

          return 0;
        },
      );
      return sortedInstalledSmartApps;
    },
  },

  mounted: function () {
    fetch("/api/installed-smart-apps?includeChildren=false")
      .then((response) => response.json())
      .then((data) => {
        if (typeof data !== "undefined" && data != null) {
          this.installedSmartApps = data;
        }
      });
  },
};
</script>
<style scoped></style>
