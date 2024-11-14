import WaveSurfer from "wavesurfer.js";

const theWaveSurfer = WaveSurfer.create({
  autoCenter: true,
  audioRate: 1,
  autoplay: false,
  autoScroll: true,
  backend: "WebAudio",
  barGap: 1,
  barRadius: 2,
  barWidth: 2,
  container: "#theWaveform .wavesurfer",
  cursorColor: "#ddd5e9",
  cursorWidth: 2,
  dragToSeek: false,
  fillParent: true,
  height: 80,
  hideScrollbar: false,
  interact: true,
  media: document.querySelector("#theWaveform .media"),
  minPxPerSec: 1,
  normalize: false,
  progressColor: "#e0e0e0",
  url: "<%= it.audioURL %>",
  waveColor: "#002a86",
});

console.log(theWaveSurfer);