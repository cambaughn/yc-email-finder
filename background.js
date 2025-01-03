chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'FIND_EMAIL') {
    findEmail(request.founderName, request.companyWebsite, request.apiKey)
      .then(sendResponse)
      .catch(error => {
        console.error('Background script error:', error);
        sendResponse({ error: error.toString() });
      });
    return true;
  }
});

async function findEmail(founderName, companyWebsite, apiKey) {
  console.log('Looking up email for:', { founderName, companyWebsite });
  
  try {
    // Check cache first
    const cacheKey = `${founderName.toLowerCase()}_${companyWebsite.toLowerCase()}`;
    const cache = await chrome.storage.local.get(cacheKey);
    
    if (cache[cacheKey]) {
      console.log('Found cached email:', cache[cacheKey]);
      return cache[cacheKey];
    }
    
    // If not in cache, call API
    console.log('No cached email found, calling API...');
    const formData = `name=${encodeURIComponent(founderName)}&domain=${encodeURIComponent(companyWebsite)}`;
    
    const response = await fetch('https://api.voilanorbert.com/2018-01-08/search/name', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`any_string:${apiKey}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      throw new Error(`API responded with status ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    console.log('Raw API Response:', data);

    // Process the response
    const result = {
      email: data.email?.email || null,
      score: data.email?.score,
      status: data.searching ? 'searching' : data.status
    };
    
    // Cache the result if we found an email
    if (result.email) {
      await chrome.storage.local.set({ [cacheKey]: result });
      console.log('Cached email result:', result);
    }
    
    return result;
  } catch (error) {
    console.error('Error in findEmail:', error);
    throw error;
  }
}

// Optional: Add a function to clear the cache if needed
async function clearEmailCache() {
  await chrome.storage.local.clear();
  console.log('Email cache cleared');
} 