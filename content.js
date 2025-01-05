function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

const debouncedAddEmailButtons = debounce(async () => {
  console.log('Adding email buttons...');
  
  // Remove ALL existing buttons first
  const existingButtons = document.querySelectorAll('.email-founder-container');
  existingButtons.forEach(container => container.remove());

  const founderElements = document.querySelectorAll('.flex.flex-row .font-medium');
  console.log('Found founder elements:', founderElements.length);
  
  for (const element of founderElements) {
    // Skip if we've already processed this element
    if (element.hasAttribute('data-has-email-button')) {
      continue;
    }

    // Only proceed if this is actually a founder name (text node)
    if (element.childNodes[0]?.nodeType === Node.TEXT_NODE) {
      element.setAttribute('data-has-email-button', 'true');
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

I'd love to understand more about what you're looking for and whether my skills and experience would be a good fit. Do you have some time in the next week or two to chat?

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
}, 100);  // 100ms debounce

function initEmailButtons() {
  console.log('Initializing email buttons...');
  
  // Clear ALL existing observers
  if (window.emailButtonObserver) {
    window.emailButtonObserver.disconnect();
    window.emailButtonObserver = null;
  }

  const observer = new MutationObserver((mutations, obs) => {
    const founderElements = document.querySelectorAll('.flex.flex-row .font-medium');
    if (founderElements.length > 0) {
      obs.disconnect();  // Disconnect immediately
      debouncedAddEmailButtons();
    }
  });
  
  observer.observe(document.body, { childList: true, subtree: true });
  
  // Handle navigation
  const handleNavigation = () => {
    // Remove existing buttons and data attributes
    const existingButtons = document.querySelectorAll('.email-founder-container');
    existingButtons.forEach(container => container.remove());
    
    document.querySelectorAll('[data-has-email-button]').forEach(el => {
      el.removeAttribute('data-has-email-button');
    });
    
    // Try to add buttons again
    debouncedAddEmailButtons();
  };

  // Clear existing listener if any
  if (window._navigationHandler) {
    window.removeEventListener('popstate', window._navigationHandler);
  }
  
  // Store new listener reference
  window._navigationHandler = handleNavigation;
  window.addEventListener('popstate', window._navigationHandler);

  // Initial setup
  debouncedAddEmailButtons();
}

// Start the observer
console.log('Starting email button initialization...');
initEmailButtons();