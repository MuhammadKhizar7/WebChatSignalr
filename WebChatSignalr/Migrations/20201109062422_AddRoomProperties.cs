using System;
using Microsoft.EntityFrameworkCore.Migrations;

namespace WebChatSignalr.Migrations
{
    public partial class AddRoomProperties : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "UnreadCount",
                table: "Rooms",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedDate",
                table: "Rooms",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "UnreadCount",
                table: "Rooms");

            migrationBuilder.DropColumn(
                name: "UpdatedDate",
                table: "Rooms");
        }
    }
}
