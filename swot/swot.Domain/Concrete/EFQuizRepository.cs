using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using swot.Domain.Abstract;
using swot.Domain.Entities;

namespace swot.Domain.Concrete
{
    public class EFQuizRepository : IQuizRepository
    {
        private EFDbContext context = new EFDbContext();

        public IQueryable<Quiz> Quizzes {
            get
            {
                return context.Quizzes.Include(quiz => quiz.Questions);
            }
        }

        public Quiz GetQuizByID(int quizID)
        {
            return context.Quizzes
                .Where(quiz => quiz.QuizID == quizID)
                .Include(quiz => quiz.Questions)
                .FirstOrDefault();
        }
    }
}
