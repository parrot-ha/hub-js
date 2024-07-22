<template>
  <div>
    <button
      type="button"
      :class="'btn ' + buttonClassComputed"
      @click="displayModal"
    >
      <slot>Add New</slot>
    </button>
    <div
      ref="extensionLocationEditModal"
      class="modal fade"
      tabindex="-1"
    >
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h1 class="modal-title fs-5">
              {{ isEdit ? "Edit" : "Add" }} Item
            </h1>
            <button
              type="button"
              class="btn-close"
              aria-label="Close"
              @click="modal.hide()"
            />
          </div>
          <div class="modal-body">
            <div class="container">
              <div class="row">
                <div class="col-12">
                  <div class="mb-3">
                    <label class="form-label">Extension name</label>
                    <input
                      v-model="localName"
                      type="text"
                      class="form-control"
                    >
                  </div>
                </div>
              </div>
              <div class="row">
                <div class="col-12">
                  <div class="mb-3">
                    <label class="form-label">Type</label>
                    <select
                      v-model="localType"
                      class="form-select"
                      aria-label="Type"
                    >
                      <option
                        v-for="locationsType in locationsTypes"
                        :key="locationsType"
                        :value="locationsType"
                      >
                        {{ locationsType }}
                      </option>
                    </select>
                  </div>
                </div>
              </div>
              <div class="row">
                <div class="col-12">
                  <div class="mb-3">
                    <label class="form-label">Location</label>
                    <input
                      v-model="localLocation"
                      type="text"
                      class="form-control"
                    >
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-secondary"
              @click="modal.hide()"
            >
              Cancel
            </button>
            <button
              type="button"
              class="btn btn-primary"
              @click="locationsSave"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import { Modal } from "bootstrap";
function handleErrors(response) {
  if (!response.ok) {
    throw Error(response.statusText);
  }
  return response;
}

export default {
  name: "ExtensionLocationEdit",
  props: ["buttonClass", "id", "name", "location", "type"],
  emits: ["locationSaved"],
  data() {
    return {
      modal: null,
      isEdit: false,
      localId: null,
      localName: null,
      localLocation: null,
      localType: null,
      locationsTypes: ["URL", "GithubRelease"],
    };
  },
  computed: {
    buttonClassComputed: function () {
      return this.buttonClass ? this.buttonClass : "btn-outline-primary";
    },
  },
  mounted: function () {
    this.modal = new Modal(this.$refs.extensionLocationEditModal);
  },
  methods: {
    locationsSave() {
      var url;
      var method;
      var body = JSON.stringify({
        name: this.localName,
        type: this.localType,
        location: this.localLocation,
      });
      if (this.isEdit) {
        url = `/api/extension_locations/${this.id}`;
        method = "PATCH";
      } else {
        url = `/api/extension_locations`;
        method = "POST";
      }

      fetch(url, {
        method: method,
        body: body,
      })
        .then(handleErrors)
        .then(() => {
          this.$emit("locationSaved");
        });

      this.modal.hide();
    },
    displayModal() {
      this.isEdit = this.id != null;
      this.localId = this.id;
      this.localName = this.name;
      this.localLocation = this.location;
      this.localType = this.type;
      this.modal.show();
    },
  },
};
</script>
