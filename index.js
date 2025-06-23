// Utility to format milliseconds as "1h 12m 8s"
function formatDuration(ms) {
  let seconds = Math.round(ms / 1000);
  const h = Math.floor(seconds / 3600);
  seconds = seconds % 3600;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return [
    h ? h + "h" : "",
    m ? m + "m" : "",
    s ? s + "s" : ""
  ].filter(Boolean).join(" ");
}

function loadDataAndDraw() {
  chrome.storage.local.get(null, (data) => {
    const summaryList = document.getElementById('summaryList');
    const totalTimeDiv = document.getElementById('totalTime');
    summaryList.innerHTML = '';

    // Calculate total time
    const entries = Object.entries(data).filter(([key, val]) => typeof val === 'number');
    const total = entries.reduce((sum, [_, ms]) => sum + ms, 0);

    // Populate summary
    // Sort by time, then slice to topN
    let topN = 10;
    if (window.location.hash === "#all") topN = entries.length;
    if (window.location.hash === "#top30") topN = 30;

    entries
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN)
      .forEach(([host, ms]) => {
        const li = document.createElement('li');
        li.textContent = `${host}: ${formatDuration(ms)} (${((ms / total) * 100).toFixed(1)}%)`;
        summaryList.appendChild(li);
      });


    totalTimeDiv.textContent = `Total time tracked: ${formatDuration(total)}`;

    // Draw chart
    const ctx = document.getElementById('usageChart').getContext('2d');
    // Destroy previous chart instance if any (prevents chart.js bug)
    if (window.usageChartInstance) window.usageChartInstance.destroy();

    // Show only top 20 in chart
    const chartEntries = entries.slice(0, 20);

    window.usageChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: chartEntries.map(([host]) => host),
        datasets: [{
          label: 'Time (minutes)',
          data: chartEntries.map(([_, ms]) => Math.round(ms / 60000)),
          backgroundColor: 'rgba(80, 140, 255, 0.7)',
          borderRadius: 8,
        }]
      },
      options: {
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: "Minutes" }
          }
        }
      }
    });
  });
}

// Load data on page load
document.addEventListener("DOMContentLoaded", loadDataAndDraw);
document.getElementById('btnTop10').addEventListener('click', () => {
  window.location.hash = '';
  window.location.reload();
});
document.getElementById('btnTop30').addEventListener('click', () => {
  window.location.hash = '#top30';
  window.location.reload();
});
document.getElementById('btnAll').addEventListener('click', () => {
  window.location.hash = '#all';
  window.location.reload();
});
document.getElementById('downloadCsvBtn').addEventListener('click', () => {
  chrome.storage.local.get(null, (data) => {
    const rows = [["Hostname", "Date", "Milliseconds"]];
    for (const [key, value] of Object.entries(data)) {
      if (!key.includes("::") || typeof value !== 'number') continue;
      const [host, date] = key.split("::");
      rows.push([host, date, value]);
    }

    const csvContent = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement("a");
    a.href = url;
    a.download = "time_audit_data.csv";
    a.click();
    URL.revokeObjectURL(url);
  });
});



// Optional: reload on focus for live stats
window.addEventListener("focus", loadDataAndDraw);
