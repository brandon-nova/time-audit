// This fills your popup list with time tracked per site
chrome.storage.local.get(null, (data) => {
  const siteList = document.getElementById('siteList');
  const entries = Object.entries(data)
  .filter(([key, val]) => typeof val === 'number')
  .sort((a, b) => b[1] - a[1])
  .slice(0, 9); // Only top 9

  const total = entries.reduce((sum, [_, ms]) => sum + ms, 0);

  for (const [host, ms] of entries) {
    const li = document.createElement('li');
    const percent = total > 0 ? ((ms / total) * 100).toFixed(1) : 0;
    li.textContent = `${host}: ${Math.round(ms / 1000)}s (${percent}%)`;
    siteList.appendChild(li);
  }

});

// This opens your dashboard page in a new tab when the button is clicked
document.getElementById('openDashboardBtn').addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
});
