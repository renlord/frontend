<template>
  <modal name="download" adaptive>
    <pre class="data"><code>{{ data }}</code></pre>
    <div class="options">
      <input
        v-model="options.minifyJson"
        type="checkbox"
        id="option-minify-json"
      />
      <label for="option-minify-json">
        Minify JSON
      </label>
    </div>
    <div class="buttons">
      <button class="button button-outline button-primary" @click="copy">
        Copy to Clipboard
      </button>
      <button class="button button-primary" @click="download">
        Download
      </button>
    </div>
  </modal>
</template>

<style lang="scss" scoped>
.data {
  max-height: 300px;
}

.options {
  margin-top: 30px;
}

.buttons {
  display: flex;
  margin-top: 30px;

  button {
    flex: 1;

    &:first-child {
      margin-right: 10px;
    }

    &:last-child {
      margin-left: 10px;
    }
  }
}
</style>

<script>
import { mapState } from "vuex";
import copy from "clipboard-copy";

import { download } from "@/util";

export default {
  data() {
    return {
      options: {
        minifyJson: false,
      },
    };
  },
  computed: {
    ...mapState([
      "startDate",
      "endDate",
      "selectedUser",
      "selectedDevice",
      "locationHistory",
    ]),
    data() {
      return this.locationHistory;
    },
  },
  methods: {
    copy() {
      const data = JSON.stringify(
        this.data,
        null,
        this.options.minifyJson ? 0 : 2
      );
      copy(data);
    },
    download() {
      const data = JSON.stringify(
        this.data,
        null,
        this.options.minifyJson ? 0 : 2
      );
      const start = this.startDate.toISOString().split("T")[0];
      const end = this.endDate.toISOString().split("T")[0];
      const user = this.selectedUser ? `_${this.selectedUser}` : "";
      const device = this.selectedDevice ? `_${this.selectedDevice}` : "";
      const filename = `data_${start}_${end}${user}${device}.json`;
      download(data, filename, "application/json");
    },
  },
};
</script>
