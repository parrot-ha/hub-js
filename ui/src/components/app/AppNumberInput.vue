<template>
  <div class="mb-3">
    <label class="form-label">{{ body.title }}</label>
    <input
      class="form-control"
      type="number"
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
    >
  </div>
</template>

<script>
export default {
  name: "AppNumberInput",
  props: ["modelValue", "body"],
  data() {
    return {};
  },
  methods: {},
};
</script>
