<template>
  <div>
    <div v-if="body.multiple">
      <div class="card">
        <div class="card-body">
          <h5 class="card-title">
            <a
              href="#"
              class="stretched-link"
              @click="deviceSelectClick"
            />
            {{ body.title }}
          </h5>
          <div class="card-text">
            <div v-if="modelValue">
              <div
                v-for="settingVal in modelValue"
                :key="settingVal"
              >
                {{
                  devices.find((device) => device.id === settingVal).displayName
                }}
              </div>
            </div>
            <div v-else>
              <div>{{ body.description }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-else>
      <div class="card">
        <div class="card-body">
          <h5 class="card-title">
            <a
              href="#"
              class="stretched-link"
              @click="deviceSelectClick"
            />{{ body.title }}
          </h5>
          <div class="card-text">
            <div v-if="modelValue">
              {{ devices.filter((device) => device.id === modelValue.trim()) }}
            </div>
            <div v-else>
              <div>{{ body.description }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      class="row"
      justify="center"
    >
      <div
        ref="appDeviceSelectModal"
        class="modal"
        tabindex="-1"
      >
        <div class="modal-dialog modal-fullscreen">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                Device List
              </h5>
              <button
                type="button"
                class="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              />
            </div>
            <div class="modal-body">
              <div
                v-for="deviceItem in sortedDeviceList"
                :key="deviceItem.id"
              >
                <div class="form-check">
                  <input
                    v-model="selectedDevices"
                    class="form-check-input"
                    type="checkbox"
                    :value="deviceItem.id"
                  >
                  <label class="form-check-label">
                    {{ deviceItem.displayName }}
                  </label>
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
                @click="
                  $emit('update:modelValue', selectedDevices);
                  modal.hide();
                "
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { Modal } from "bootstrap";

export default {
  name: "AppDeviceSelect",
  props: ["modelValue", "body", "devices"],
  emits: ["update:modelValue"],
  data() {
    return {
      modal: null,
      deviceList: [],
      selectedDevices: [],
      modalVisible: false,
    };
  },
  computed: {
    sortedDeviceList: function () {
      if (this.deviceList != null && this.deviceList.length > 0) {
        let sortedDevices = [...this.deviceList].sort((a, b) => {
          const nameA = a.displayName.toUpperCase();
          const nameB = b.displayName.toUpperCase();
          if (nameA < nameB) {
            return -1;
          }
          if (nameA > nameB) {
            return 1;
          }

          return 0;
        });
        return sortedDevices;
      } else {
        return this.deviceList;
      }
    },
  },
  mounted: function () {
    this.modal = new Modal(this.$refs.appDeviceSelectModal);
  },
  methods: {
    closeDialog: function () {
      this.$emit("input", this.value);
    },
    deviceSelectClick: function () {
      fetch(`/api/devices?filter=${this.body.type}&field=id&field=displayName`)
        .then((response) => response.json())
        .then((data) => {
          if (typeof data !== "undefined" && data != null) {
            this.deviceList = data;
          }
        });
      this.selectedDevices = this.modelValue;
      this.modal.show();
    },
  },
};
</script>

<style scoped></style>
