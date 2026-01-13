using Microsoft.AspNetCore.Mvc;
using Project.Service.Common;
using System.Collections.Concurrent;

namespace Project.Api.Controllers.CM
{
    [Route("api/[controller]")]
    [ApiController]
    public class LogController : ControllerBase
    {
        private readonly string _logPath;

        public LogController()
        {
            var possiblePaths = new[]
            {
                Path.Combine(Environment.CurrentDirectory, "Logs"),
                Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Logs"),
                Path.Combine(Directory.GetCurrentDirectory(), "Logs"),
                Path.Combine(AppContext.BaseDirectory, "Logs")
            };
            _logPath = possiblePaths.FirstOrDefault(Directory.Exists) ?? possiblePaths[0];
        }

        [HttpGet("Search")]
        public async Task<IActionResult> Search()
        {
            var res = new TransferObject();
            try
            {
                var logs = await ReadTodayLogsAsync();
                res.Data = logs;
            }
            catch (Exception ex)
            {
                await res.GetMessage("0001", null);
            }
            return Ok(res);
        }

        private async Task<List<string>> ReadTodayLogsAsync()
        {
            var today = DateTime.Today;
            var dateStr = today.ToString("yyyy-MM-dd");
            var allLogs = new ConcurrentBag<string>();

            try
            {
                var fileTasks = new List<Task>();

                var todayFile = Path.Combine(_logPath, $"{dateStr}.log");
                if (System.IO.File.Exists(todayFile))
                {
                    fileTasks.Add(ParseLogFileAsync(todayFile, allLogs));
                }

                var archiveDir = Path.Combine(_logPath, "archives");
                if (Directory.Exists(archiveDir))
                {
                    var archivedFiles = Directory.GetFiles(archiveDir, $"{dateStr}*.log");

                    foreach (var file in archivedFiles)
                    {
                        fileTasks.Add(ParseLogFileAsync(file, allLogs));
                    }
                }

                await Task.WhenAll(fileTasks);

                var sortedLogs = allLogs
                    .Where(log => !string.IsNullOrWhiteSpace(log))
                    .OrderByDescending(log => ExtractTimestamp(log))
                    .ToList();

                return sortedLogs;
            }
            catch
            {
                return new List<string>();
            }
        }

        private async Task ParseLogFileAsync(string filePath, ConcurrentBag<string> logs)
        {
            try
            {
                var lines = await System.IO.File.ReadAllLinesAsync(filePath);
                var currentLog = new System.Text.StringBuilder();

                foreach (var line in lines)
                {
                    if (string.IsNullOrWhiteSpace(line))
                        continue;
                    var isNewLogEntry = IsStartsWithTimestamp(line.Trim());

                    if (isNewLogEntry)
                    {
                        if (currentLog.Length > 0)
                        {
                            logs.Add(currentLog.ToString().Trim());
                            currentLog.Clear();
                        }
                        currentLog.AppendLine(line.Trim());
                    }
                    else
                    {
                        if (currentLog.Length > 0)
                        {
                            currentLog.AppendLine(line.Trim());
                        }
                    }
                }

                if (currentLog.Length > 0)
                {
                    logs.Add(currentLog.ToString().Trim());
                }
            }
            catch
            {
                
            }
        }

        private bool IsStartsWithTimestamp(string line)
        {
            if (string.IsNullOrWhiteSpace(line))
                return false;

            var timestampPattern = @"^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3,4}";
            return System.Text.RegularExpressions.Regex.IsMatch(line, timestampPattern);
        }

        private DateTime ExtractTimestamp(string logEntry)
        {
            try
            {
                var firstLine = logEntry.Split('\n')[0];
                var parts = firstLine.Split('|');
                if (parts.Length > 0)
                {
                    var timestampPart = parts[0].Trim();
                    if (DateTime.TryParse(timestampPart, out var timestamp))
                    {
                        return timestamp;
                    }
                }
            }
            catch
            {
                
            }
            return DateTime.MinValue;
        }
    }
}