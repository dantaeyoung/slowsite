<template>
  <div class="votinginterface" @click="mouseclick">
    <slot> </slot>
    <div
      class="votingpoint"
      :style="pointstyle"
      @click.stop="pointerclick"
      @mouseover="hoveringOnPointer = true"
      @mouseleave="hoveringOnPointer = false"
    >
      <img src="/images/interface/hand_down.svg" />
      <div class="votingconfirm" :class="{ show: hoveringOnPointer }">confirm??</div>
    </div>
    {{ this.voteX }}
    {{ this.voteY }}

    {{ hoveringOnPointer }}
  </div>
</template>

<style lang="scss" scoped>
.votinginterface {
  padding: 0px;
  margin: 0px;
  position: relative;
}

.votingpoint {
  position: absolute;
  top: -35px;
  left: -18px;
  transition: all 500ms ease-in-out;
  cursor: pointer;

}

.votingconfirm {
  position: absolute;
  bottom: 0px;
  display: none;

  &.show  {
    display: block !important;
  }
}
</style>

<script>

export default {

  data() {
    return {
      voteX: -1,
      voteY: -1,
      hoveringOnPointer: false,
    }
  },
  methods: {
    mouseclick(e) {
      console.log("CLICK offset", e.offsetX, e.offsetY)
      this.voteX = e.offsetX;
      this.voteY = e.offsetY;
    },

    pointerclick() {
      console.log("YO")
    },

  },
  computed: {
    pointstyle() {
//      return { top: this.voteY + 'px', left: this.voteX + 'px'};
      return { transform: `translate(${this.voteX}px, ${this.voteY}px)` };
    },
  },

}
</script>
