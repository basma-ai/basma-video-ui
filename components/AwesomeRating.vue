<template>
  <div class="emojis_rating">

    <div class="emoji" @click="update_value(1)">
      😞
    </div>

    <div class="emoji" @click="update_value(2)">
    😟
    </div>

    <div class="emoji" @click="update_value(3)">
    😕
    </div>

    <div class="emoji" @click="update_value(4)">
    🙂
    </div>

    <div class="emoji" @click="update_value(5)">
    😁
    </div>

  </div>
</template>
<script>

  export default {
    props: ['value'],
    methods: {
      update_value: function (new_val) {
        this.$emit('rating_set', {
          rating: new_val
        });
        this.$emit('input', {
          rating: new_val
        });
      }
    }
  }

</script>

<style>
  .emojis_rating .emoji {
    display: inline-block;
    font-size: 40px;
    transition: all 0.2s;
    cursor: pointer;
    padding: 5px;
    line-height: 60px;
    opacity: 0.5;
    user-select: none;
  }

  .emojis_rating .emoji:hover {
    font-size: 60px;
    padding: 0;
    opacity: 1;
  }

  .emojis_rating .emoji:active {
    font-size: 50px;
    padding: 5;
    opacity: 0.8;
  }
</style>
