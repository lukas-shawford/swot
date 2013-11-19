using System;
using System.Web.Mvc;
using System.Web.Routing;
using Ninject;
using swot.Domain.Abstract;
using swot.Domain.Concrete;

namespace swot.WebUI.Infrastructure
{
    public class NinjectControllerFactory : DefaultControllerFactory
    {
        private IKernel ninjectKernel;

        public NinjectControllerFactory()
        {
            ninjectKernel = new StandardKernel();
            AddBindings();
        }

        protected override IController GetControllerInstance(RequestContext requestContext,
            Type controllerType)
        {
            return controllerType == null
                ? null
                : (IController)ninjectKernel.Get(controllerType);
        }

        private void AddBindings()
        {
            // put additional bindings here
            ninjectKernel.Bind<IQuizRepository>().To<EFQuizRepository>();
        }
    }
}