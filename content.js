function initEmailButtons() {
  console.log('Initializing email buttons...');
  
  let isProcessing = false;
  
  const observer = new MutationObserver((mutations) => {
    if (isProcessing) return;
    
    for (const mutation of mutations) {
      if (mutation.addedNodes.length) {
        // Check if we're on a page with founders
        const founderElements = document.querySelectorAll('.flex.flex-row .font-medium');
        if (founderElements.length > 0) {
          isProcessing = true;
          addEmailButtons().finally(() => {
            isProcessing = false;
          });
          break;
        }
      }
    }
  });

  // Start observing the document with the configured parameters
  observer.observe(document.body, { childList: true, subtree: true });
  console.log('Observer started');
  
  // Also run once immediately in case we're already on a page with founders
  addEmailButtons();
}

async function addEmailButtons() {
  console.log('Adding email buttons...');
  
  // Remove any existing email buttons first to prevent duplicates
  document.querySelectorAll('.email-founder-container').forEach(container => {
    container.remove();
  });

  const founderElements = document.querySelectorAll('.flex.flex-row .font-medium');
  console.log('Found founder elements:', founderElements.length);
  
  for (const element of founderElements) {
    // Skip if this element already has an email button container
    if (element.querySelector('.email-founder-container')) {
      console.log('Skipping founder - already has button');
      continue;
    }

    if (element.childNodes[0].nodeType === Node.TEXT_NODE) {
      const founderName = element.childNodes[0].textContent.trim();
      const companyWebsite = document.querySelector('a[href*="/website"]')?.textContent;
      
      console.log('Processing founder:', founderName, 'website:', companyWebsite);
      
      if (!companyWebsite) {
        console.log('Company website not found, skipping email button');
        continue;
      }

      // Check if email is cached
      const cacheKey = `${founderName.toLowerCase()}_${companyWebsite.toLowerCase()}`;
      const cache = await chrome.storage.local.get(cacheKey);
      const isEmailCached = !!cache[cacheKey]?.email;
      
      // Create container for button and checkmark
      const container = document.createElement('span');
      container.className = 'email-founder-container';
      container.style.display = 'inline-flex';
      container.style.alignItems = 'center';
      container.style.gap = '4px';
      
      // Create email button
      const emailBtn = document.createElement('button');
      emailBtn.textContent = 'Email founder';
      emailBtn.className = 'email-founder-btn';
      
      // Create checkmark if email is cached
      if (isEmailCached) {
        const checkmark = document.createElement('span');
        checkmark.innerHTML = '✓';
        checkmark.title = 'Email found in cache';
        checkmark.style.cssText = `
          color: #34D399;
          font-weight: bold;
          font-size: 16px;
        `;
        container.appendChild(checkmark);
      }
      
      container.appendChild(emailBtn);
      
      emailBtn.onclick = async () => {
        try {
          const { voilaNorbertKey } = await chrome.storage.sync.get('voilaNorbertKey');
          
          if (!voilaNorbertKey) {
            alert('Please set your Voila Norbert API key in the extension settings');
            return;
          }

          const cleanDomain = companyWebsite.replace(/^https?:\/\//, '').replace(/\/$/, '');
          
          // First check cache
          const cachedData = await chrome.storage.local.get(cacheKey);
          let emailData = cachedData[cacheKey];

          if (!emailData?.email) {
            // If not in cache, call API
            emailData = await chrome.runtime.sendMessage({
              type: 'FIND_EMAIL',
              founderName,
              companyWebsite: cleanDomain,
              apiKey: voilaNorbertKey
            });
          }
          
          if (emailData.error) {
            alert(`Error: ${emailData.error}`);
            return;
          }
          
          if (emailData.email) {
            const firstName = founderName.split(' ')[0];
            const emailTemplate = `Hi ${firstName},

I saw on the YC Work at a Startup site that you're hiring for a Frontend Engineer, and I'd like to throw my hat in the ring.

For the last few years, I've been at Sinclair Digital working on a React application that powers 150 local news stations and entertainment sites with tens of millions of users every month.  

Prior to that, I built a language education startup that helped thousands of people learn Spanish, writing the code for the mobile app and custom CMS, and also the entire curriculum!

I'd love to understand more about what you're looking for and whether my skills and experience would be a good fit. I know it's crazy around the holidays, but do you have some time in the next week or two?

Best,
Cameron Baughn

P.S. Here's my LinkedIn profile: https://www.linkedin.com/in/cambaughn/`;

            const subject = encodeURIComponent('Frontend Engineer role');
            const body = encodeURIComponent(emailTemplate);
            window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${emailData.email}&su=${subject}&body=${body}`);
            
            // Add checkmark if it's not already there
            if (!isEmailCached) {
              const checkmark = document.createElement('span');
              checkmark.innerHTML = '✓';
              checkmark.title = 'Email found in cache';
              checkmark.style.cssText = `
                color: #34D399;
                font-weight: bold;
                font-size: 16px;
              `;
              container.insertBefore(checkmark, emailBtn);
            }
          } else {
            alert('Could not find email for this founder');
          }
        } catch (error) {
          console.error('Content script error:', error);
          alert(`Error: ${error.message}`);
        }
      };
      
      element.appendChild(container);
    }
  }
}

// Start the observer
console.log('Starting email button initialization...');
initEmailButtons();