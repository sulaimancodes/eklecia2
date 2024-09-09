/**
 * Loosely based on an example from:
 * http://onlinetonegenerator.com/pitch-shifter.html
 */

// This is pulling SoundTouchJS from the local file system. See the README for proper usage.
import { PitchShifter } from './soundtouch.js';

const playBtn = document.getElementById('play');
const stopBtn = document.getElementById('stop');
const tempoSlider = document.getElementById('tempoSlider');
const tempoOutput = document.getElementById('tempo');
tempoOutput.innerHTML = tempoSlider.value;
const pitchSlider = document.getElementById('pitchSlider');
const pitchOutput = document.getElementById('pitch');
pitchOutput.innerHTML = pitchSlider.value;
const keySlider = document.getElementById('keySlider');
const keyOutput = document.getElementById('key');
keyOutput.innerHTML = keySlider.value;
const volumeSlider = document.getElementById('volumeSlider');
const volumeOutput = document.getElementById('volume');
volumeOutput.innerHTML = volumeSlider.value;
const currTime = document.getElementById('currentTime');
const duration = document.getElementById('duration');
const progressMeter = document.getElementById('progressMeter');

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const gainNode = audioCtx.createGain();
let shifter;

const loadSource = async function (url1, url2) {
  playBtn.setAttribute('disabled', 'disabled');
  if (shifter) {
    shifter.off();
  }
  const buffer1 = await fetch(url1).then(res => res.arrayBuffer());
  const buffer2 = await fetch(url2).then(res => res.arrayBuffer());

  audioCtx.decodeAudioData(buffer1, (audioBuffer1) => {
    audioCtx.decodeAudioData(buffer2, (audioBuffer2) => {
      // Create a new buffer that is the length of both buffers combined
      const combinedBuffer = audioCtx.createBuffer(
        audioBuffer1.numberOfChannels,
        audioBuffer1.length + audioBuffer2.length,
        audioBuffer1.sampleRate
      );

      // Copy the data from the first buffer into the new buffer
      for (let channel = 0; channel < audioBuffer1.numberOfChannels; channel++) {
        combinedBuffer.getChannelData(channel).set(audioBuffer1.getChannelData(channel), 0);
        combinedBuffer.getChannelData(channel).set(audioBuffer2.getChannelData(channel), audioBuffer1.length);
      }

      shifter = new PitchShifter(audioCtx, combinedBuffer, 16384);
      shifter.tempo = tempoSlider.value;
      shifter.pitch = pitchSlider.value;
      shifter.on('play', (detail) => {
        currTime.innerHTML = detail.formattedTimePlayed;
        progressMeter.value = detail.percentagePlayed;
      });
      duration.innerHTML = shifter.formattedDuration;
      playBtn.removeAttribute('disabled');
    });
  });
};

loadSource('./bensound-actionable.mp3', './bensound-actionable.mp3');


let is_playing = false;
const play = function () {
  shifter.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  audioCtx.resume().then(() => {
    is_playing = true;
    this.setAttribute('disabled', 'disabled');
  });
};

const pause = function (playing = false) {
  shifter.disconnect();
  is_playing = playing;
  playBtn.removeAttribute('disabled');
};

playBtn.onclick = play;
stopBtn.onclick = pause;

tempoSlider.addEventListener('input', function () {
  tempoOutput.innerHTML = shifter.tempo = this.value;
});

pitchSlider.addEventListener('input', function () {
  pitchOutput.innerHTML = shifter.pitch = this.value;
  shifter.tempo = tempoSlider.value;
});

keySlider.addEventListener('input', function () {
  shifter.pitchSemitones = this.value;
  keyOutput.innerHTML = this.value / 2;
  shifter.tempo = tempoSlider.value;
});

volumeSlider.addEventListener('input', function () {
  volumeOutput.innerHTML = gainNode.gain.value = this.value;
});

progressMeter.addEventListener('click', function (event) {
  const pos = event.target.getBoundingClientRect();
  const relX = event.pageX - pos.x;
  const perc = relX / event.target.offsetWidth;
  pause(is_playing);
  shifter.percentagePlayed = perc;
  progressMeter.value = 100 * perc;
  currTime.innerHTML = shifter.timePlayed;
  if (is_playing) {
    play();
  }
});
