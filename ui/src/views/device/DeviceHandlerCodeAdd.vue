<template>
  <div class="container-fluid">
    <div class="row">
      <div class="col">
        <div
          v-if="alertMessage"
          ref="alertBox"
          class="alert alert-danger alert-dismissible"
          role="alert"
        >
          {{ alertMessage }}
          <button
            type="button"
            class="btn-close"
            aria-label="Close"
            @click="alertMessage = null"
          />
        </div>
      </div>
    </div>
    <div class="row">
      <div class="col">
        <code-editor
          :source="deviceHandler.sourceCode"
          title="Add"
          button-name="Save"
          :save-pending="savePending"
          :editor-height="editorHeight"
          @save-code-button-clicked="saveCode"
        />
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

import CodeEditor from "@/components/common/CodeEditor.vue";
import _debounce from "lodash/debounce";

export default {
  name: "DeviceHandlerCodeAdd",
  components: {
    CodeEditor,
  },
  data() {
    return {
      savePending: false,
      alertMessage: null,
      deviceHandler: { sourceCode: "" },
      editorHeight: "500px",
    };
  },
  watch: {
    alertMessage() {
      this.debouncedResizeEditor();
    },
  },
  created() {
    window.addEventListener("resize", this.onResize);
    this.debouncedResizeEditor = _debounce(this.resizeEditor, 250);
  },
  unmounted() {
    window.removeEventListener("resize", this.onResize);
  },
  mounted: function () {
    this.resizeEditor();
    this.$nextTick(() => {
      this.resizeEditor();
    });
  },
  methods: {
    saveCode(updatedCode) {
      this.savePending = true;
      this.alertMessage = null;
      this.deviceHandler.sourceCode = updatedCode;

      fetch(`/api/device-handlers/source`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(this.deviceHandler),
      })
        .then(handleErrors)
        .then((response) => {
          return response.json();
        })
        .then((data) => {
          this.savePending = false;
          if (!data.success) {
            this.alertMessage = data.message;
          } else {
            this.$router.push(`/dh-code/${data.id}/edit`);
          }
        })
        .catch((error) => {
          this.savePending = false;
          console.log(error);
        });
    },
    onResize() {
      this.debouncedResizeEditor();
    },
    resizeEditor() {
      this.editorHeight = `${
        window.innerHeight -
        (this.editorHeightAdjustment =
          (this.$refs.alertBox?.clientHeight
            ? this.$refs.alertBox.clientHeight + 20
            : 0) + 153)
      }px`;
    },
  },
};
</script>
