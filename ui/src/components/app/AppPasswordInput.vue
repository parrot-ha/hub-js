<template>
  <div class="mb-3">
    <label class="form-label">{{ body.title }}</label>
    <input
      class="form-control"
      type="password"
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
    >
  </div>
</template>

<script>
export default {
  name: "AppPasswordInput",
  props: ["modelValue", "body"],
  data() {
    return {};
  },
  methods: {},
};
</script>
