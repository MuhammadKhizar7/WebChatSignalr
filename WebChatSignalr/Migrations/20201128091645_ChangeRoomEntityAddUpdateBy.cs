using Microsoft.EntityFrameworkCore.Migrations;

namespace WebChatSignalr.Migrations
{
    public partial class ChangeRoomEntityAddUpdateBy : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "UpdatedBy",
                table: "Rooms",
                nullable: false,
                defaultValue: 0);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "Rooms");
        }
    }
}
