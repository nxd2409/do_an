using DocumentFormat.OpenXml.Spreadsheet;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Project.Core;

namespace Project.Service.Services
{
    public class BackgroundJobService
    {
        private readonly AppDbContext _dbContext;
        //private readonly HttpClient _httpClient;
        private readonly IConfiguration _config;
        public BackgroundJobService(AppDbContext dbContext, IConfiguration configuration)
        {
            _dbContext = dbContext;
            //_httpClient = httpClient;
            _config = configuration;
        }

        public async Task AutoEndMeetingVote()
        {
            try
            {
                var today = DateTime.Today;

                var lstMeetingExpired = await _dbContext.MeetingInfo
                    .Where(x => x.ExpectedStartTime.Value.Date < today && (x.Status == 0 || x.Status == 1))
                    .ToListAsync();

                foreach (var item in lstMeetingExpired)
                {
                    if (item.Status == 0)
                    {
                        item.Status = 3;
                    }
                    else
                    {
                        item.Status = 2;
                    }
                }
                await _dbContext.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.ToString());
            }
        }
    }
}
