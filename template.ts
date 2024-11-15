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
  height: 48,
  hideScrollbar: false,
  interact: true,
  media: document.querySelector("#theWaveform .media"),
  minPxPerSec: 1,
  normalize: false,
  progressColor: "#e0e0e0",
  url: "<%= it.audioURL %>",
  waveColor: "#002a86",
});

function tab(ix) {
  let children = document.querySelectorAll("#theTabs .tab");
  children.forEach((child) => {
    if (child.id === `tab${ix}`) {
      child.classList.add("active");
    } else child.classList.remove("active");
  });
  children = document.querySelectorAll("#theTranscript .tab-content");
  children.forEach((child) => {
    child.style.display = child.id === `content${ix}` ? "block" : "none";
  });
}

tab(3);
