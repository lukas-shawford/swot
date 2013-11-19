using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace swot.Domain.Entities
{
    public class Question
    {
        public int QuestionID { get; set; }

        [Required]
        public Quiz Quiz { get; set; }

        public int SequenceNum { get; set; }
        public string QuestionText { get; set; }
        public string Answer { get; set; }
    }
}
