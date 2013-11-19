using System.Web.Mvc;
using swot.Domain.Abstract;

namespace swot.WebUI.Controllers
{
    public class HomeController : Controller
    {
        private IQuizRepository repository;

        public HomeController(IQuizRepository quizRepository)
        {
            repository = quizRepository;
        }

        public ActionResult Index()
        {
            return View(repository.Quizzes);
        }

        public ActionResult About()
        {
            ViewBag.Message = "Your app description page.";

            return View();
        }

        public ActionResult Contact()
        {
            ViewBag.Message = "Your contact page.";

            return View();
        }
    }
}
