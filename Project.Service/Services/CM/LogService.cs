using Project.Service.Common;
using Project.Service.Dtos.CM;
using System.Text.Json;

namespace Project.Service.Services.CM
{
    public interface ILogService
    {
        Task<LogDto> GetLogsAsync(DateTime date, string? level = null, int page = 1, int pageSize = 100);
    }

    public class LogService : ILogService
    {
        private readonly string _logPath = Path.Combine(Directory.GetCurrentDirectory(), "Logs");

        public async Task<LogDto> GetLogsAsync(DateTime date, string? level = null, int page = 1, int pageSize = 100)
        {
            var logs = await ReadLogsAsync(date);

            if (!string.IsNullOrEmpty(level))
                logs = logs.Where(x => x.Level.Equals(level, StringComparison.OrdinalIgnoreCase)).ToList();

            var total = logs.Count;
            var pagedLogs = logs.Skip((page - 1) * pageSize).Take(pageSize).ToList();

            return new LogDto
            {
                Logs = pagedLogs,
                TotalCount = total,
                Page = page,
                PageSize = pageSize
            };
        }

        private async Task<List<LogEntry>> ReadLogsAsync(DateTime date)
        {
            var logs = new List<LogEntry>();
            var dateStr = date.ToString("yyyy-MM-dd");

            var currentFile = Path.Combine(_logPath, $"{dateStr}.json");
            if (File.Exists(currentFile))
                logs.AddRange(await ParseLogFileAsync(currentFile));

            var archiveDir = Path.Combine(_logPath, "archives");
            if (Directory.Exists(archiveDir))
            {
                var archivedFiles = Directory.GetFiles(archiveDir, $"{dateStr}*.json");
                foreach (var file in archivedFiles)
                    logs.AddRange(await ParseLogFileAsync(file));
            }

            return logs.OrderBy(x => x.Timestamp).ToList();
        }

        private async Task<List<LogEntry>> ParseLogFileAsync(string filePath)
        {
            var logs = new List<LogEntry>();
            var lines = await File.ReadAllLinesAsync(filePath);

            foreach (var line in lines)
            {
                if (string.IsNullOrWhiteSpace(line)) continue;

                try
                {
                    var log = JsonSerializer.Deserialize<LogEntry>(line);
                    if (log != null) logs.Add(log);
                }
                catch
                {

                }
            }

            return logs;
        }
    }
}
