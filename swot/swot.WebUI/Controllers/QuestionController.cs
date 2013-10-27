using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using swot.Domain.Abstract;

namespace swot.WebUI.Controllers
{
    public class QuestionController : Controller
    {
        private IQuestionRepository repository;

        public QuestionController(IQuestionRepository questionRepository)
        {
            repository = questionRepository;
        }

        public ViewResult List()
        {
            return View(repository.Questions);
        }
    }
}
