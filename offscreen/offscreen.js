// ! Do error handling where webkitSpeechRecognition is not available


const recognition = new webkitSpeechRecognition();
recognition.continuous = false;
recognition.interimResults = false;
let oriSenderId;

recognition.onresult = (event) => {
  const transcript = event.results[0][0].transcript;
  // Send the transcribed text back to the content script or background
  chrome.runtime.sendMessage({ target: 'background', action: 'audio-input-result-delegation', result: transcript, oriSenderId: oriSenderId });
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.target === 'offscreen' && message.action === 'take-audio-input') {
    oriSenderId = message.oriSenderId;
    recognition.start();
  }
});