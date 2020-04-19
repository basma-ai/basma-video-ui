<template>
  <div class="emojis_rating">
    <div class="emoji" v-bind:class="{rated: rating == 1}" @click="update_value(1)">😞</div>
    <div class="emoji" v-bind:class="{rated: rating == 2}" @click="update_value(2)">😟</div>
    <div class="emoji" v-bind:class="{rated: rating == 3}" @click="update_value(3)">😕</div>
    <div class="emoji" v-bind:class="{rated: rating == 4}" @click="update_value(4)">🙂</div>
    <div class="emoji" v-bind:class="{rated: rating == 5}" @click="update_value(5)">😁</div>
  </div>
</template>
<script>
export default {
  props: ["value"],
  data: () => ({
    rating: 0
  }),
  methods: {
    update_value: function(new_val) {
      this.$emit("rating_set", {
        rating: new_val
      });
      this.$emit("input", {
        rating: new_val
      });
      this.rating = new_val;
    }
  }
};
</script>

<style>
.emojis_rating .emoji {
  display: inline-block;
  font-size: 40px;
  transition: all 0.2s;
  cursor: pointer;
  padding: 5px;
  line-height: 60px;
  opacity: 0.8;
  user-select: none;
}

.emojis_rating .emoji:hover {
  font-size: 60px;
  padding: 0;
  opacity: 1;
}

.emojis_rating .emoji:active {
  font-size: 60px;
  padding: 0;
  opacity: 1;
}

.rated {
  font-size: 70px !important;
  padding: 0 !important;
  opacity: 1 !important;
}
</style>
