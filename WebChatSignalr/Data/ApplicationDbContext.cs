using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using WebChatSignalr.Models;

namespace WebChatSignalr.Data
{
    public class ApplicationDbContext : IdentityDbContext<AppUser, IdentityRole<int>, int>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }
        public DbSet<Room> Rooms { get; set; }
        public DbSet<Message> Messages { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);
            builder.Entity<AppUser>().Property(x => x.Name).HasMaxLength(100);
            builder.Entity<Message>().Property(x => x.Content).HasMaxLength(500);
            builder.Entity<Room>().HasOne<AppUser>().WithMany(x => x.Rooms).HasForeignKey(x => x.UserId);
            builder.Entity<Room>().HasOne(x=>x.Creator).WithMany(x => x.Rooms).HasForeignKey(x=>x.CreatorId);
        }
    }
}
