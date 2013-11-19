namespace swot.Domain.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class InitialCreate : DbMigration
    {
        public override void Up()
        {
            CreateTable(
                "dbo.Quiz",
                c => new
                    {
                        QuizID = c.Int(nullable: false, identity: true),
                        Name = c.String(),
                    })
                .PrimaryKey(t => t.QuizID);
            
            CreateTable(
                "dbo.Question",
                c => new
                    {
                        QuestionID = c.Int(nullable: false, identity: true),
                        SequenceNum = c.Int(nullable: false),
                        QuestionText = c.String(),
                        Answer = c.String(),
                        Quiz_QuizID = c.Int(nullable: false),
                    })
                .PrimaryKey(t => t.QuestionID)
                .ForeignKey("dbo.Quiz", t => t.Quiz_QuizID, cascadeDelete: true)
                .Index(t => t.Quiz_QuizID);
            
        }
        
        public override void Down()
        {
            DropIndex("dbo.Question", new[] { "Quiz_QuizID" });
            DropForeignKey("dbo.Question", "Quiz_QuizID", "dbo.Quiz");
            DropTable("dbo.Question");
            DropTable("dbo.Quiz");
        }
    }
}
