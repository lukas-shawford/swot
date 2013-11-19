using System.Linq;
using swot.Domain.Entities;

namespace swot.Domain.Abstract
{
    public interface IQuizRepository
    {
        IQueryable<Quiz> Quizzes { get; }

        Quiz GetQuizByID(int quizID);
    }
}
