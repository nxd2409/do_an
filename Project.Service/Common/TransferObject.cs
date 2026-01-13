using Microsoft.Extensions.Caching.Distributed;
using System.Text.Json;
using Project.Core.Entities.AD;

namespace Project.Service.Common
{
    public class TransferObject
    {
        public bool Status { get; set; }
        public object? Data { get; set; }
        public MessageObject MessageObject { get; set; }
        private const string CacheKeyAllMessages = "AdMessage:All";
        public TransferObject()
        {
            Status = true;
            MessageObject = new MessageObject();
        }

        public async Task GetMessage(string code, IBaseService service, CancellationToken cancellationToken = default)
        {
            Status = service.Status;
            var sp = ServiceProviderAccessor.Instance;
            if (sp == null) return;

            var cache = sp.GetService(typeof(IDistributedCache)) as IDistributedCache;
            if (cache == null) return ;

            var json = await cache.GetStringAsync(CacheKeyAllMessages, cancellationToken);
            if (string.IsNullOrWhiteSpace(json)) return;

            try
            {
                var messages = JsonSerializer.Deserialize<List<MessageDto>>(json) ?? new List<MessageDto>();
                var found = messages.FirstOrDefault(m => string.Equals(m.Code, code, StringComparison.OrdinalIgnoreCase));
                if (found != null)
                {
                    MessageObject.Code = found.Code ?? string.Empty;
                    MessageObject.Language = found.Lang ?? string.Empty;
                    MessageObject.Message = found.Message ?? string.Empty;
                    MessageObject.MessageType = found.Type ?? string.Empty;
                }

                if (!service.Status)
                {
                    MessageObject.MessageDetail += service?.Exception?.Message?.ToString() + "<br>" + service?.Exception?.InnerException?.ToString();
                }
            }
            catch
            {
                // ignore deserialization errors
            }
        }
    }

    public class MessageObject
    {
        public string Code { get; set; }
        public string Language { get; set; }
        public string Message { get; set; }
        public string MessageDetail { get; set; }
        public string MessageType { get; set; }
        public string LogId { get; set; }
        public MessageObject()
        {
            Code = string.Empty;
            Message = string.Empty;
            MessageDetail = string.Empty;
            MessageType = string.Empty;
            LogId = string.Empty;
        }
    }
   
}
