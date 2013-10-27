using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.Mvc;
using System.Web.Routing;
using Moq;
using Ninject;
using swot.Domain.Abstract;
using swot.Domain.Entities;

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
            // Mock implementation of the IQuestionRepository interface
            Mock<IQuestionRepository> mock = new Mock<IQuestionRepository>();
            mock.Setup(m => m.Questions).Returns(new List<Question>
            {
                new Question
                {
                    QuestionText = "What is the capital of North Dakota?",
                    Answer = "Bismarck"
                },
                new Question
                {
                    QuestionText = "What is the default squawk code for VFR aircraft in the United States?",
                    Answer = "1200"
                },
                new Question
                {
                    QuestionText = "You are a senior executive at a Pharmacy Benefit Management (PBM) firm. After a recent acquisition of another PBM, your firm is now able to offer clients a wider range of sophisticated administrative and clinically-based services. Does this represent a strength or an opportunity according to SWOT analysis?",
                    Answer = "strength"
                }
            }.AsQueryable());
            ninjectKernel.Bind<IQuestionRepository>().ToConstant(mock.Object);
        }
    }
}