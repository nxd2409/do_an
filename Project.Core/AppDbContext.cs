using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Project.Core.Common;
using Project.Core.Entities.AD;
using Project.Core.Entities.CM;
using Project.Core.Entities.MD;
using Project.Core.Entities.MT;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace Project.Core
{
    public class AppDbContext : DbContext
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        public AppDbContext(DbContextOptions<AppDbContext> options, IHttpContextAccessor httpContextAccessor)
            : base(options)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.ApplyAllConfigurations();
            base.OnModelCreating(modelBuilder);
        }

        public override int SaveChanges()
        {
            TrackChanges();
            return base.SaveChanges();
        }

        public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            TrackChanges();
            return base.SaveChangesAsync(cancellationToken);
        }

        public string? GetUserRequest()
        {
            var header = _httpContextAccessor?.HttpContext?.Request?.Headers["Authorization"].ToString();
            if (string.IsNullOrWhiteSpace(header)) return null;

            var parts = header.Split(' ', StringSplitOptions.RemoveEmptyEntries);
            var token = parts.Length > 1 && parts[0].Equals("Bearer", StringComparison.OrdinalIgnoreCase) ? parts[1] : parts[0];

            if (string.IsNullOrWhiteSpace(token) || token == "null") return null;

            if (new JwtSecurityTokenHandler().ReadToken(token) is JwtSecurityToken jwt)
                return jwt.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Name)?.Value;

            return null;
        }

        private void TrackChanges()
        {
            var user = GetUserRequest();
            foreach (var entry in ChangeTracker.Entries())
            {
                switch (entry.State)
                {
                    case EntityState.Added:
                        if (entry.Entity is IBaseEntity addedEntity)
                        {
                            addedEntity.IsActive ??= true;
                            addedEntity.CreateBy = user;
                            addedEntity.CreateDate = DateTime.Now;
                        }
                        break;

                    case EntityState.Modified:
                        if (entry.Entity is IBaseEntity modifiedEntity)
                        {
                            entry.Property(nameof(IBaseEntity.CreateBy)).IsModified = false;
                            entry.Property(nameof(IBaseEntity.CreateDate)).IsModified = false;
                            modifiedEntity.UpdateBy = user;
                            modifiedEntity.UpdateDate = DateTime.Now;
                        }
                        break;
                }
            }
        }

        #region System Manager
        public DbSet<AdMessage> AdMessage { get; set; }
        public DbSet<AdAccount> AdAccount { get; set; }
        public DbSet<AdAccountAccountGroup> AdAccountAccountGroup { get; set; }
        public DbSet<AdAccountGroup> AdAccountGroup { get; set; }
        public DbSet<AdAccountGroupRight> AdAccountGroupRight { get; set; }
        public DbSet<AdAccountRight> AdAccountRight { get; set; }
        public DbSet<AdHistoryLogin> AdHistoryLogin { get; set; }
        public DbSet<AdMenu> AdMenu { get; set; }
        public DbSet<AdMenuRight> AdMenuRight { get; set; }
        public DbSet<AdRight> AdRight { get; set; }
        #endregion

        #region Master Data
        public DbSet<MdOrganize> MdOrganize { get; set; }
        public DbSet<MdTitle> MdTitle { get; set; }
        public DbSet<MdRoom> MdRoom { get; set; }
        public DbSet<MdRoomItem> MdRoomItem { get; set; }
        #endregion

        #region Common
        public DbSet<CmFile> CmFile { get; set; }
        #endregion

        #region Meeting
        public DbSet<MeetingPersonal> MeetingPersonal { get; set; }
        public DbSet<MeetingInfo> MeetingInfo { get; set; }
        public DbSet<MeetingMessage> MeetingMessage { get; set; }
        public DbSet<MeetingVote> MeetingVote { get; set; }
        public DbSet<MeetingVoteResults> MeetingVoteResults { get; set; }
        public DbSet<MeetingRoomLayout> MeetingRoomLayout { get; set; }
        #endregion
    }
}