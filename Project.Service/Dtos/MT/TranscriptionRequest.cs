using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Project.Service.Dtos.MT
{
    public class TranscriptionRequest
    {
        public string? MeetingId { get; set; }
        public string? Username { get; set; }
        public string? Text { get; set; }
        public bool? IsFinal { get; set; }
    }
}
