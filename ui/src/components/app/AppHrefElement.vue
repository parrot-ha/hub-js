<template>
  <div
    class="card"
    @click="hrefClicked"
  >
    <h5 class="card-title">
      {{ body.title }}
    </h5>
    <div class="card-text">
      {{ body.description }}
    </div>
  </div>
</template>

<script>
export default {
  name: "AppHrefElement",
  props: ["body"],
  data() {
    return {};
  },
  methods: {
    hrefClicked: function () {
      if (this.body.url) {
        window.open(this.body.url, "_blank");
      } else {
        this.$emit("hrefPage", this.body.page);
      }
    },
  },
};
</script>

<style scoped>
.app-href-element {
  border: 0px;
}
.v-card__text,
.v-card__title {
  padding: 0px;
}
</style>
