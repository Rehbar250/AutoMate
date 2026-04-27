document.addEventListener('DOMContentLoaded', () => {
    const syncBtn = document.getElementById('sync-btn');
    const logWindow = document.getElementById('log-window');
    const statusText = document.getElementById('status-text');
    const statusBadge = document.getElementById('status-badge');
    const lastSyncTime = document.getElementById('last-sync-time');
    
    // Trigger Sync via API
    syncBtn.addEventListener('click', async () => {
        syncBtn.disabled = true;
        syncBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Syncing...';
        
        try {
            await fetch('/api/sync', { method: 'POST' });
            fetchStatus(); // Immediately update UI
        } catch (error) {
            console.error("Failed to trigger sync", error);
        }
    });

    // Fetch Agent Status
    async function fetchStatus() {
        try {
            const res = await fetch('/api/status');
            const data = await res.json();
            
            lastSyncTime.textContent = data.lastRun;
            
            if (data.isRunning) {
                statusText.textContent = "Syncing in progress...";
                statusBadge.className = "status-indicator warning";
                syncBtn.disabled = true;
                syncBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Syncing...';
            } else {
                statusText.textContent = `Idle (${data.status})`;
                statusBadge.className = data.status === "Error" ? "status-indicator error" : "status-indicator active";
                syncBtn.disabled = false;
                syncBtn.innerHTML = '<i class="fa-solid fa-rotate"></i> Sync Now';
            }
        } catch (error) {
            statusText.textContent = "Backend Offline";
            statusBadge.className = "status-indicator error";
            syncBtn.disabled = true;
        }
    }

    // Fetch Logs
    async function fetchLogs() {
        try {
            const res = await fetch('/api/logs');
            const data = await res.json();
            
            // Basic log parsing for colors
            let formattedLogs = data.logs.split('\n').map(line => {
                let cls = 'log-line';
                if (line.includes(' - ERROR - ') || line.includes(' - CRITICAL - ')) cls += ' log-error';
                else if (line.includes(' - WARNING - ')) cls += ' log-warn';
                return `<span class="${cls}">${line}</span>`;
            }).join('');
            
            // Only auto-scroll to bottom if user is already at the bottom
            const isScrolledToBottom = logWindow.scrollHeight - logWindow.clientHeight <= logWindow.scrollTop + 20;
            
            if (logWindow.innerHTML !== formattedLogs) {
                logWindow.innerHTML = formattedLogs || "Waiting for logs...";
                if (isScrolledToBottom) {
                    logWindow.scrollTop = logWindow.scrollHeight;
                }
            }
        } catch (error) {
            console.error("Failed to fetch logs");
        }
    }

    // Initial fetch and set loops
    fetchStatus();
    fetchLogs();
    
    // Poll for updates
    setInterval(fetchStatus, 3000);
    setInterval(fetchLogs, 2000);
});
