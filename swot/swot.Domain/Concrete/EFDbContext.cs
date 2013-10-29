using System.Data.Entity;
using swot.Domain.Entities;

namespace swot.Domain.Concrete
{
    public class EFDbContext : DbContext
    {
        public DbSet<Question> Questions { get; set; }
    }
}
