using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using swot.Domain.Abstract;
using swot.Domain.Entities;

namespace swot.Domain.Concrete
{
    public class EFQuestionRepository : IQuestionRepository
    {
        private EFDbContext context = new EFDbContext();

        public IQueryable<Question> Questions {
            get { return context.Questions; }
        }
    }
}
