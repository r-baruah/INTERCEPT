// DRAFTING THE AUDIO LOGIC
// Don't use this file, just testing logic

function onSolarWind(speed) {
  // Normal speed is 300. Storm is 800.
  // Map 300 -> 0.1hz LFO
  // Map 800 -> 5.0hz LFO

  const rate = (speed - 300) / 500; 
  drone.lfo.value = rate; 

  // MEMO: Add a limiter so we don't blow speakers
}

// TODO: How do we handle the "Carrington Event"? 
// Maybe hardcode the values?
const CARRINGTON_PRESET = {
  wind: 1200,
  kp: 9,
  flare: "X28"
};
