using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Project.Core.Entities.MT;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Project.Core.Refrences.MT
{
    public class MeetingPersonalConfig : IEntityTypeConfiguration<MeetingPersonal>
    {
        public void Configure(EntityTypeBuilder<MeetingPersonal> builder)
        {
            builder.HasOne(x => x.Title)
                   .WithMany()
                   .HasForeignKey(x => x.TitleCode)
                   .OnDelete(DeleteBehavior.NoAction);
        }
    }
}
