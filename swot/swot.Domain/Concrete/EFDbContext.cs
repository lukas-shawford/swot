using System.Data.Entity;
using System.Data.Entity.ModelConfiguration.Conventions;
using swot.Domain.Entities;

namespace swot.Domain.Concrete
{
    public class EFDbContext : DbContext
    {
        protected override void OnModelCreating(DbModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            modelBuilder.Conventions.Remove<PluralizingTableNameConvention>();
        }

        public DbSet<Quiz> Quizzes { get; set; }
    }
}
