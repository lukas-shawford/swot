using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Entity;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using swot.Domain.Abstract;
using swot.Domain.Entities;
using swot.Domain.Concrete;

namespace swot.WebUI.Controllers
{
    public class QuizController : Controller
    {
        private IQuizRepository repository = new EFQuizRepository();

        //
        // GET: /Quiz/Index/5

        public ActionResult Index(int id = 0)
        {
            Quiz quiz = repository.GetQuizByID(id);

            if (quiz == null)
            {
                return HttpNotFound();
            }
            return View(quiz);
        }
    }
}