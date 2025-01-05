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

function guessEmail(founderName, companyWebsite) {
  // Get first name and clean domain
  const firstName = founderName.split(' ')[0].toLowerCase().trim();
  let domain = companyWebsite.toLowerCase().trim()
    .replace('www.', '')
    .replace('https://', '')
    .replace('http://', '')
    .replace(/\/$/, ''); // Remove trailing slash

  return {
    email: `${firstName}@${domain}`,
    score: 0.5, // Medium confidence score
    status: 'guessed'
  };
}

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
    
    // Try Voila Norbert first, if it fails, use our guess function
    try {
      // Original API call code...
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
        throw new Error(`API responded with status ${response.status}`);
      }

      const data = await response.json();
      console.log('Raw API Response:', data);

      const result = {
        email: data.email?.email || null,
        score: data.email?.score,
        status: data.searching ? 'searching' : data.status
      };

      if (result.email) {
        await chrome.storage.local.set({ [cacheKey]: result });
        return result;
      }
    } catch (error) {
      console.log('Voila Norbert failed, falling back to guess:', error);
    }

    // If we get here, either the API failed or didn't find an email
    const guessedResult = guessEmail(founderName, companyWebsite);
    await chrome.storage.local.set({ [cacheKey]: guessedResult });
    return guessedResult;

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