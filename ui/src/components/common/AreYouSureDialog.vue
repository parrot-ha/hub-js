<template>
  <div>
    <button
      type="button"
      :class="'btn ' + buttonClassComputed"
      :disabled="buttonDisabled"
      @click="modal.show()"
    >
      <slot>Delete</slot>
    </button>
    <div
      ref="areYoutSureModal"
      class="modal fade"
      tabindex="-1"
      aria-hidden="true"
    >
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h1 class="modal-title fs-5">
              {{ title }}
            </h1>
            <button
              type="button"
              class="btn-close"
              aria-label="Close"
              @click="modal.hide()"
            />
          </div>
          <div class="modal-body">
            {{ body }}
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
              class="btn btn-danger"
              data-bs-dismiss="modal"
              @click="
                modal.hide();
                $emit('confirmAction');
              "
            >
              {{ confirmButton }}
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
  name: "AreYouSureDialog",
  props: ["buttonClass", "buttonDisabled", "title", "body", "confirmButton"],
  emits: ["confirmAction"],
  data() {
    return {};
  },
  computed: {
    buttonClassComputed: function () {
      return this.buttonClass ? this.buttonClass : "btn-danger";
    },
  },
  mounted: function () {
    this.modal = new Modal(this.$refs.areYoutSureModal);
  },
  methods: {},
};
</script>
