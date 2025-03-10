<?php
header('Content-Type: text/html; charset=utf-8');

$logFile = __DIR__ . '/logs/app_debug.log';

// Function to format log entries for HTML display
function formatLogEntry($entry) {
    // Escape HTML special characters
    $entry = htmlspecialchars($entry);
    
    // Colorize different log levels
    $entry = preg_replace('/\[ERROR\]/', '<span style="color: red;">[ERROR]</span>', $entry);
    $entry = preg_replace('/\[INFO\]/', '<span style="color: blue;">[INFO]</span>', $entry);
    $entry = preg_replace('/\[DEBUG\]/', '<span style="color: green;">[DEBUG]</span>', $entry);
    
    return $entry;
}

?>
<!DOCTYPE html>
<html>
<head>
    <title>App Debug Logs</title>
    <style>
        body {
            font-family: monospace;
            padding: 20px;
            background: #f5f5f5;
        }
        .log-container {
            background: white;
            padding: 20px;
            border-radius: 5px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        .log-entry {
            margin-bottom: 10px;
            padding: 10px;
            border-bottom: 1px solid #eee;
            white-space: pre-wrap;
        }
        .refresh-btn {
            padding: 10px 20px;
            background: #4CAF50;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            margin-bottom: 20px;
        }
        .refresh-btn:hover {
            background: #45a049;
        }
        .clear-btn {
            padding: 10px 20px;
            background: #f44336;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            margin-bottom: 20px;
            margin-left: 10px;
        }
        .clear-btn:hover {
            background: #da190b;
        }
    </style>
</head>
<body>
    <h1>App Debug Logs</h1>
    
    <button class="refresh-btn" onclick="location.reload()">Refresh Logs</button>
    
    <form method="post" style="display: inline;">
        <input type="submit" name="clear_logs" value="Clear Logs" class="clear-btn"
               onclick="return confirm('Are you sure you want to clear all logs?')">
    </form>

    <div class="log-container">
        <?php
        // Handle log clearing
        if (isset($_POST['clear_logs'])) {
            file_put_contents($logFile, '');
            echo "<p>Logs have been cleared.</p>";
        }
        
        // Read and display logs
        if (file_exists($logFile)) {
            $logs = file_get_contents($logFile);
            if (empty($logs)) {
                echo "<p>No logs found.</p>";
            } else {
                $entries = array_filter(explode("\n", $logs));
                foreach ($entries as $entry) {
                    if (!empty(trim($entry))) {
                        echo '<div class="log-entry">' . formatLogEntry($entry) . '</div>';
                    }
                }
            }
        } else {
            echo "<p>Log file does not exist.</p>";
        }
        ?>
    </div>
</body>
</html>
