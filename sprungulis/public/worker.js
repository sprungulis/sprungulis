let state = {
  count: 0,
};

self.onmessage = (event) => {
  const message = event;
  self.postMessage(message.data);
};
