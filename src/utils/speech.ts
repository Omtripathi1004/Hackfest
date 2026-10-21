export function speakText(text: string, lang: 'hi-IN' | 'en-IN' = 'hi-IN') {
  if (!('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported in this browser.');
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = lang === 'hi-IN' ? 0.92 : 0.98;
  utterance.pitch = 1.0;

  // Attempt to select a native voice if available
  const voices = window.speechSynthesis.getVoices();
  const targetVoice = voices.find(
    (v) => v.lang.startsWith(lang.slice(0, 2)) || v.name.includes(lang === 'hi-IN' ? 'Hindi' : 'English')
  );
  if (targetVoice) {
    utterance.voice = targetVoice;
  }

  window.speechSynthesis.speak(utterance);
}

export function stopSpeech() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
