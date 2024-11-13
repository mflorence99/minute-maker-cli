/* deno-lint-ignore no-unused-vars */

let theWaveSurfer;

function initialize() {
  theWaveSurfer = WaveSurfer.create({
    autoCenter: true,
    audioRate: 1,
    autoplay: false,
    autoScroll: true,
    backend: "WebAudio",
    barAlign: "",
    barGap: 1,
    barHeight: null,
    barRadius: 2,
    barWidth: 2,
    container: document.querySelector("#theWaveform .wavesurfer"),
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
    splitChannels: false,
    url: "<%= it.audioURL %>",
    waveColor: "#002a86",
  });
}
