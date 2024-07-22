<template>
  <div>
    <button
      type="button"
      class="btn btn-outline-secondary"
      @click="modal.show()"
    >
      <slot />
    </button>
    <div
      ref="loggerAddModal"
      class="modal fade"
      tabindex="-1"
      aria-labelledby="loggerAddModalLabel"
      aria-hidden="true"
    >
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h1 class="modal-title fs-5">
              {{ isEdit ? "Edit" : "Add" }}Logger
            </h1>
            <button
              type="button"
              class="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            />
          </div>
          <div class="modal-body">
            <form>
              <div>
                <label class="form-label">Logger Name</label>
                <input
                  v-model="localLoggerName"
                  type="text"
                  class="form-control"
                  :readonly="isEdit"
                >
              </div>
              <div>
                <label class="form-label">Logger Level</label>
                <select
                  v-model="localLoggerLevel"
                  class="form-select"
                  aria-label="Logger Level"
                >
                  <option
                    v-for="ll in loggerLevels"
                    :key="ll"
                    :value="ll"
                  >
                    {{ ll }}
                  </option>
                </select>
              </div>
            </form>
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
              class="btn btn-primary"
              @click="saveLogger"
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

export default {
  name: "LoggerEditModal",
  props: ["loggerName", "loggerLevel"],
  emits: ["loggerAdded"],
  data() {
    return {
      modal: null,
      localLoggerName: null,
      localLoggerLevel: null,
      loggerLevels: ["TRACE", "DEBUG", "INFO", "WARN", "ERROR"],
      isEdit: false,
    };
  },
  mounted: function () {
    this.localLoggerName = null;
    this.localLoggerLevel = null;
    this.isEdit = false;
    if (this.loggerName != null && this.loggerLevel != null) {
      this.isEdit = true;
      this.localLoggerName = this.loggerName;
      this.localLoggerLevel = this.loggerLevel;
    }
    this.modal = new Modal(this.$refs.loggerAddModal);
  },
  methods: {
    saveLogger: function () {
      fetch("/api/settings/logging-config", {
        method: this.isEdit ? "PUT" : "POST",
        body: JSON.stringify({
          name: this.localLoggerName,
          level: this.localLoggerLevel,
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            console.log("success");
            this.$emit("loggerSaved");
          }
          this.modal.hide();
        });
    },
  },
};
</script>
