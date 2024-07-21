<template>
  <div>
    <div class="row g-3">
      <div class="col-auto me-auto">
        <h4>
          {{ title }}
        </h4>
      </div>
      <div class="col-auto">
        <div class="d-flex gap-3">
          <span
            v-show="savePending"
            class="spinner-border"
          />
          <button
            class="btn btn-primary"
            :disabled="savePending"
            @click="saveCode"
          >
            Save
          </button>
          <slot />
        </div>
      </div>
    </div>
    <br>

    <div
      class="editor-wrapper"
      :style="{ height: editorHeight }"
    >
      <div
        ref="ace"
        class="ace-editor"
      />
    </div>
  </div>
</template>
<script>
import ace from "ace-builds";
import "ace-builds/src-min-noconflict/theme-monokai";
import "ace-builds/src-min-noconflict/mode-javascript";
import "ace-builds/src-min-noconflict/ext-searchbox";

export default {
  name: "CodeEditor",
  props: ["title", "source", "savePending", "editorHeight"],
  emits: ["saveCodeButtonClicked"],
  data() {
    return {
      localSource: "",
      editor: null,
    };
  },
  watch: {
    source(newSource) {
      this.localSource = newSource;
      this.editor.session.setValue(this.localSource);
      this.$nextTick(() => {
        this.editor.resize();
      });
    },
    editorHeight() {
      this.$nextTick(() => {
        this.editor.resize();
      });
    },
  },
  mounted: function () {
    var vm = this;
    this.editor = ace.edit(this.$refs.ace, {
      minLines: 10,
      fontSize: 16,
      theme: this.themePath,
      mode: this.modePath,
      tabSize: 4,
      showGutter: true,
      showPrintMargin: false,
    });
    this.editor.renderer.setScrollMargin(0, 5, 0, 5);
    this.editor.session.setMode("ace/mode/javascript");
    this.editor.setTheme("ace/theme/monokai");
    this.editor.commands.addCommand({
      name: "save",
      bindKey: { win: "Ctrl-s", mac: "Command-s" },
      exec: vm.saveCode,
      readOnly: true,
    });
  },
  methods: {
    saveCode() {
      this.$emit("saveCodeButtonClicked", this.editor.getValue());
    },
  },
};
</script>
<style scoped>
.editor-wrapper {
  width: 100%;
  display: inline-block;
  position: relative;
}
.ace-editor {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
}
</style>
