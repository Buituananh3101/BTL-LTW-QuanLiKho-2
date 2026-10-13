using Microsoft.EntityFrameworkCore;
using BTL_LTW_QuanLiKho_2.Models;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllersWithViews().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
});
builder.Services.AddDbContext<QuanLyKhoPhuQuocLtwContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("QuanLyKhoPhuQuocLtwContext")));

builder.Services.AddScoped<BTL_LTW_QuanLiKho_2.Services.ITonKhoService, BTL_LTW_QuanLiKho_2.Services.TonKhoService>();
builder.Services.AddScoped<BTL_LTW_QuanLiKho_2.Services.IBanHangService, BTL_LTW_QuanLiKho_2.Services.BanHangService>();

builder.Services.AddAuthentication(Microsoft.AspNetCore.Authentication.Cookies.CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.LoginPath = "/Account/Login";
        options.LogoutPath = "/Account/Logout";
        options.AccessDeniedPath = "/Account/AccessDenied";
        options.ExpireTimeSpan = TimeSpan.FromHours(8);
        options.SlidingExpiration = true;
    });

builder.Services.AddSession(options =>
{
    options.IdleTimeout = TimeSpan.FromHours(4);
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseRouting();

app.UseSession();
app.UseAuthentication();
app.UseAuthorization();

app.MapStaticAssets();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=PhieuKiemKe}/{action=Index}/{id?}")
    .WithStaticAssets();


app.Run(); 
