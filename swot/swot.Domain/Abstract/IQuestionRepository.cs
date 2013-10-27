using System.Linq;
using swot.Domain.Entities;

namespace swot.Domain.Abstract
{
    public interface IQuestionRepository
    {
        IQueryable<Question> Questions { get; }
    }
}
