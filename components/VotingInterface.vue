<template>
  <div class="votinginterface" @click="mouseclick" @mousemove.capture="mousemove">
    <slot> </slot>
    <div
      class="votingpoint"
      :style="pointstyle"
      @click.stop="pointerclick"
      @mouseover="hoveringOnPointer = true"
      @mouseleave="hoveringOnPointer = false"
    >
      <img :src="handImg" />
    </div>
    <div
      class="votingconfirm"
      :class="{ show: hoveringOnPointer }"
      :style="hoverstyle"
    >
      <div v-if="votingStage == 0">vote??</div>
      <div v-if="votingStage == 1">confirm??</div>
      <div v-if="votingStage == 2">REALLY confirm??</div>
    </div>
    {{ this.voteX }}
    {{ this.voteY }}
    {{ this.mouseX }}
    {{ this.mouseY }}

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
  top: 0px;
  left: 0px;
  display: none;

  &.show {
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
      votingStage: 0,
      mouseX: -1,
      mouseY: -1,
    }
  },
  methods: {
    mousemove(e) {
      this.mouseX = e.clientX
      this.mouseY = e.clientY
    },
    mouseclick(e) {
      console.log(this.$fire.database	)

      // TODO THE MAGIC
      this.$fire.database.ref('/hey').set(e.offsetX);
      this.$fire.database.ref('/hey').on('value', (snapshot) => {
        console.log(snapshot.val());
      });

      if (this.votingStage == 0) {
        console.log('CLICK offset', e.offsetX, e.offsetY)
        this.voteX = e.offsetX
        this.voteY = e.offsetY
      } else {
        this.votingStage = Math.max(0, this.votingStage - 1)
      }
    },
    pointerclick() {
      console.log('YO')
      this.votingStage += 1
    },
  },
  computed: {
    pointstyle() {
      return { transform: `translate(${this.voteX}px, ${this.voteY}px)` }
    },
    hoverstyle() {
      return { transform: `translate(${this.mouseX}px, ${this.mouseY}px)` }
    },
    handImg() {
      if (this.votingStage == 0) {
        return '/images/interface/hand_down.svg'
      }
      if (this.votingStage >= 1) {
        return '/images/interface/hand_deciding.svg'
      }
    },
  },
}
</script>
