using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Project.Core.Common
{
    public interface IDto { }
    public class BaseDto
    {
        public bool? IsActive { get; set; }
        public int CurrentPage { get; set; } = 1;
        public int PageSize { get; set; } = 50;
        public string? KeyWord { get; set; }
        public bool? IsPaging { get; set; } = true;
    }
}
