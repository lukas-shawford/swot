using System.Data.Entity.Migrations;
using System.Linq;
using swot.Domain.Concrete;
using swot.Domain.Entities;

namespace swot.Domain.Migrations
{
    internal sealed class Configuration : DbMigrationsConfiguration<EFDbContext>
    {
        public Configuration()
        {
            AutomaticMigrationsEnabled = false;
        }

        protected override void Seed(EFDbContext context)
        {
            //  This method will be called after migrating to the latest version.

            //  You can use the DbSet<T>.AddOrUpdate() helper extension method 
            //  to avoid creating duplicate seed data. E.g.
            //
            //    context.People.AddOrUpdate(
            //      p => p.FullName,
            //      new Person { FullName = "Andrew Peters" },
            //      new Person { FullName = "Brice Lambson" },
            //      new Person { FullName = "Rowan Miller" }
            //    );
            //

            context.Quizzes.AddOrUpdate(
                q => q.QuizID,
                new swot.Domain.Entities.Quiz
                {
                    QuizID = 1,
                    Name = "Quiz 1",
                    Questions = new []
                    {
                        new swot.Domain.Entities.Question
                        {
                            QuestionID = 1,
                            SequenceNum = 1,
                            QuestionText = "What is the capital of North Dakota?",
                            Answer = "Bismarck"
                        },
                        new swot.Domain.Entities.Question
                        {
                            QuestionID = 2,
                            SequenceNum = 2,
                            QuestionText = "What is the default squawk code for VFR aircraft in the United States?",
                            Answer = "1200"
                        },
                        new swot.Domain.Entities.Question
                        {
                            QuestionID = 3,
                            SequenceNum = 3,
                            QuestionText = "You are a senior executive at a Pharmacy Benefit Management (PBM) firm. After a recent acquisition of another PBM, your firm is now able to offer clients a wider range of sophisticated administrative and clinically-based services. Does this represent a strength or an opportunity according to SWOT analysis?",
                            Answer = "strength"
                        }
                    }.ToList()
                }
            );
        }
    }
}
