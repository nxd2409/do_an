using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using Project.Core;
using Project.Core.Entities.AD;
using Project.Service.Common;
using Project.Service.Dtos.AD;
using System.Text.Json;

namespace Project.Service.Services.AD
{
    public interface IMessageService : IGenericService<AdMessage, MessageDto>
    {
    }

    public class MessageService(AppDbContext dbContext, IMapper mapper) : GenericService<AdMessage, MessageDto>(dbContext, mapper), IMessageService
    {

    }

    public interface IMessageCacheService
    {
        Task SyncFromDatabaseAsync(CancellationToken cancellationToken);
    }

    public class MessageCacheService : IMessageCacheService
    {
        private readonly AppDbContext _dbContext;
        private readonly IDistributedCache _cache;
        private const string CacheKey = "AdMessage:All";

        public MessageCacheService(AppDbContext dbContext, IDistributedCache cache)
        {
            _dbContext = dbContext;
            _cache = cache;
        }

        public async Task SyncFromDatabaseAsync(CancellationToken cancellationToken)
        {
            var messages = await _dbContext.AdMessage
                .AsNoTracking()
                .ToListAsync(cancellationToken);

            var serialized = JsonSerializer.Serialize(messages);
            await _cache.SetStringAsync(CacheKey, serialized, new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(1)
            }, cancellationToken);
        }
    }
}
