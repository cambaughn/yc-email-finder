document.getElementById('save').onclick = async () => {
  const voilaNorbertKey = document.getElementById('voilaNorbertKey').value;
  
  await chrome.storage.sync.set({
    voilaNorbertKey
  });
  
  alert('Settings saved!');
};

// Load saved settings
chrome.storage.sync.get('voilaNorbertKey', (data) => {
  if (data.voilaNorbertKey) {
    document.getElementById('voilaNorbertKey').value = data.voilaNorbertKey;
  }
}); 