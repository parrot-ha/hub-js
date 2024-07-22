<template>
  <div class="container-fluid">
    <div class="row">
      <div class="col">
        <div class="card">
          <div class="card-body">
            <div
              class="card-title d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3"
            >
              <h5>Extensions</h5>
              <div class="btn-toolbar mb-2 mb-md-0">
                <button
                  type="button"
                  class="btn btn-sm btn-outline-secondary css-tooltip"
                  @click="loadExtensions(true)"
                >
                  Check For Updates
                </button>
              </div>
            </div>

            <div class="card-text">
              <div
                v-for="(value, key) in extensionStatus"
                :key="key"
                class="alert alert-warning alert-dismissible fade show"
                role="alert"
              >
                {{ value }}
                <button
                  type="button"
                  class="btn-close"
                  data-bs-dismiss="alert"
                  aria-label="Close"
                />
              </div>
              <ul class="nav nav-tabs">
                <li class="nav-item">
                  <a
                    :class="'nav-link' + (tab == 'INT' ? ' active' : '')"
                    :aria-current="tab == 'INT'"
                    href="#"
                    @click="tab = 'INT'"
                  >Installed</a>
                </li>
                <li class="nav-item">
                  <a
                    :class="'nav-link' + (tab == 'AVL' ? ' active' : '')"
                    :aria-current="tab == 'AVL'"
                    href="#"
                    @click="tab = 'AVL'"
                  >Available</a>
                </li>
                <li class="nav-item">
                  <a
                    :class="'nav-link' + (tab == 'LOC' ? ' active' : '')"
                    :aria-current="tab == 'LOC'"
                    href="#"
                    @click="tab = 'LOC'"
                  >Locations</a>
                </li>
              </ul>
              <br>
              <div class="tab-content">
                <div v-if="tab == 'INT'">
                  <table class="table">
                    <thead>
                      <tr>
                        <th
                          scope="col"
                          style="width: 15%"
                        >
                          Actions
                        </th>
                        <th
                          scope="col"
                          style="width: 20%"
                        >
                          Name
                        </th>
                        <th
                          scope="col"
                          style="width: 55%"
                        >
                          Description
                        </th>
                        <th
                          scope="col"
                          style="width: 10%"
                        >
                          Version
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="extension in installedExtensions"
                        :key="extension.id"
                      >
                        <td>
                          <div>
                            <div class="btn-group">
                              <are-you-sure-dialog
                                button-class="btn-sm btn-outline-primary"
                                title="Delete Extension"
                                body="Are you sure you want to delete this extension?"
                                confirm-button="Delete"
                                @confirm-action="deleteExtension(extension.id)"
                              >
                                <i class="bi bi-trash" />
                              </are-you-sure-dialog>
                              <button
                                v-if="extension.updateAvailable"
                                type="button"
                                class="btn btn-sm btn-outline-primary css-tooltip"
                                :data-tooltip="
                                  'Update to version ' +
                                    extension.updateInfo?.version
                                "
                                @click="updateExtension(extension.id)"
                              >
                                <i class="bi bi-cloud-download" />
                              </button>
                            </div>
                          </div>
                        </td>
                        <td>
                          {{ extension.name }}
                        </td>
                        <td>{{ extension.description }}</td>
                        <td>{{ extension.version }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div v-else-if="tab == 'AVL'">
                  <table class="table">
                    <thead>
                      <tr>
                        <th
                          scope="col"
                          style="width: 5%"
                        >
                          Actions
                        </th>
                        <th
                          scope="col"
                          style="width: 20%"
                        >
                          Name
                        </th>
                        <th
                          scope="col"
                          style="width: 65%"
                        >
                          Description
                        </th>
                        <th
                          scope="col"
                          stype="width: 10%"
                        >
                          Version
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="extension in availableExtensions"
                        :key="extension.id"
                      >
                        <td>
                          <button
                            type="button"
                            class="btn btn-sm btn-outline-primary"
                            @click="downloadExtension(extension.id)"
                          >
                            <i class="bi bi-cloud-download" />
                          </button>
                        </td>
                        <td>{{ extension.name }}</td>
                        <td>{{ extension.description }}</td>
                        <td>{{ extension.version }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div v-else-if="tab == 'LOC'">
                  <div class="row g-3">
                    <div class="col-auto me-auto" />
                    <div class="col-auto">
                      <extension-location-edit
                        @location-saved="locationsUpdated"
                      />
                    </div>
                  </div>
                  <table class="table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Location</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="location in locations"
                        :key="location.id"
                      >
                        <td>
                          {{ location.name }}
                        </td>
                        <td>{{ location.type }}</td>
                        <td>{{ location.location }}</td>
                        <td>
                          <div class="btn-group">
                            <are-you-sure-dialog
                              button-class="btn-sm btn-outline-primary"
                              title="Delete Extension Location"
                              body="Are you sure you want to delete this extension location?"
                              confirm-button="Delete"
                              @confirm-action="
                                deleteExtensionLocation(location.id)
                              "
                            >
                              <i class="bi bi-trash" />
                            </are-you-sure-dialog>
                            <extension-location-edit
                              :id="location.id"
                              button-class="btn-sm btn-outline-primary"
                              :name="location.name"
                              :type="location.type"
                              :location="location.location"
                              @location-saved="locationsUpdated"
                            >
                              <i class="bi bi-pencil" />
                            </extension-location-edit>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import AreYouSureDialog from "@/components/common/AreYouSureDialog.vue";
import ExtensionLocationEdit from "@/components/extensions/ExtensionLocationEdit.vue";

function handleErrors(response) {
  if (!response.ok) {
    throw Error(response.statusText);
  }
  return response;
}

export default {
  name: "ExtensionList",
  components: {
    AreYouSureDialog,
    ExtensionLocationEdit,
  },
  data() {
    return {
      tab: "INT",
      extensions: [],
      locations: [],
      extensionStatus: {},
    };
  },
  computed: {
    installedExtensions: function () {
      return this.extensions.filter(function (ext) {
        return ext.installed === true;
      });
    },
    availableExtensions: function () {
      return this.extensions.filter(function (ext) {
        return ext.installed !== true;
      });
    },
  },
  watch: {},
  mounted: function () {
    this.loadExtensions(false);
    this.loadExtensionLocations();
  },

  methods: {
    loadExtensions: function (doRefresh) {
      fetch(`/api/extensions?refresh=${doRefresh}`)
        .then((response) => response.json())
        .then((data) => {
          if (typeof data !== "undefined" && data != null) {
            this.extensions = data;
          }
        });
    },

    loadExtensionLocations: function () {
      fetch("/api/extension_locations")
        .then((response) => response.json())
        .then((data) => {
          if (typeof data !== "undefined" && data != null) {
            this.locations = data;
          }
        });
    },

    updateExtension: function (extensionId) {
      var url = `/api/extensions/${extensionId}?action=update`;
      var extension = this.extensions?.filter(
        (extension) => extension.id == extensionId,
      );
      this.extensionStatus.extensionId =
        "Updating extension " + extension[0].name;
      fetch(url, {
        method: "POST",
        body: null,
      })
        .then(handleErrors)
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            this.extensionStatus.extensionId =
              "Done updating extension " + extension[0].name;
          } else {
            this.extensionStatus.extensionId =
              "Error while updating extension " + extension[0].name;
          }
          this.loadExtensions(true);
        });
    },

    downloadExtension: function (extensionId) {
      var url = `/api/extensions/${extensionId}?action=download`;
      var extension = this.extensions?.filter(
        (extension) => extension.id == extensionId,
      );
      this.extensionStatus.extensionId =
        "Installing extension " + extension[0].name;
      fetch(url, {
        method: "POST",
        body: null,
      })
        .then(handleErrors)
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            this.extensionStatus.extensionId =
              "Done installing extension " + extension[0].name;
          } else {
            this.extensionStatus.extensionId =
              "Error while installing extension " + extension[0].name;
          }
          this.loadExtensions(true);
        });
    },
    deleteExtension: function (extensionId) {
      var url = `/api/extensions/${extensionId}`;
      //TODO: handle response
      fetch(url, {
        method: "DELETE",
        body: null,
      })
        .then(handleErrors)
        .then(() => {
          this.loadExtensions(true);
        });
    },
    deleteExtensionLocation(locationId) {
      var url = `/api/extension_locations/${locationId}`;
      //TODO: handle response
      fetch(url, {
        method: "DELETE",
        body: null,
      })
        .then(handleErrors)
        .then(() => {
          this.loadExtensionLocations();
          this.loadExtensions(false);
        });
    },
    locationsUpdated() {
      this.$nextTick(() => {
        this.loadExtensionLocations();
        this.loadExtensions(false);
      });
    },
  },
};
</script>
