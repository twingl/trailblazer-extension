export function send(message) {
  chrome.runtime.sendMessage(message);
};

export function listen(listener) {
  chrome.runtime.onMessage.addListener(listener);
};

export default { send, listen };
