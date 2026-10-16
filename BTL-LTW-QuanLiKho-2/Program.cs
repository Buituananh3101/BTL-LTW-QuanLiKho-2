using Microsoft.EntityFrameworkCore;
using BTL_LTW_QuanLiKho_2.Models;
// Tự động định vị ContentRootPath trỏ đúng vào thư mục project chứa Views và wwwroot
var contentRoot = Directory.GetCurrentDirectory();
if (!Directory.Exists(Path.Combine(contentRoot, "Views")))
{
    var projectSubDir = Path.Combine(contentRoot, "BTL-LTW-QuanLiKho-2");
    if (Directory.Exists(Path.Combine(projectSubDir, "Views")))
    {
        contentRoot = projectSubDir;
    }
    else
    {
        var baseDir = new DirectoryInfo(AppContext.BaseDirectory);
        while (baseDir != null && baseDir.Exists)
        {
            if (Directory.Exists(Path.Combine(baseDir.FullName, "Views")))
            {
                contentRoot = baseDir.FullName;
                break;
            }
            if (Directory.Exists(Path.Combine(baseDir.FullName, "BTL-LTW-QuanLiKho-2", "Views")))
            {
                contentRoot = Path.Combine(baseDir.FullName, "BTL-LTW-QuanLiKho-2");
                break;
            }
            baseDir = baseDir.Parent;
        }
    }
}
Directory.SetCurrentDirectory(contentRoot);

var builder = WebApplication.CreateBuilder(new WebApplicationOptions
{
    Args = args,
    ContentRootPath = contentRoot
});
// Add services to the container.
builder.Services.AddControllersWithViews().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
});
builder.Services.AddDbContext<QuanLyKhoPhuQuocLtwContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("QuanLyKhoPhuQuocLtwContext")));

builder.Services.AddScoped<BTL_LTW_QuanLiKho_2.Services.ITonKhoService, BTL_LTW_QuanLiKho_2.Services.TonKhoService>();
builder.Services.AddScoped<BTL_LTW_QuanLiKho_2.Services.IBanHangService, BTL_LTW_QuanLiKho_2.Services.BanHangService>();
builder.Services.AddScoped<BTL_LTW_QuanLiKho_2.Services.INhatKyThaoTacService, BTL_LTW_QuanLiKho_2.Services.NhatKyThaoTacService>();
builder.Services.AddScoped<BTL_LTW_QuanLiKho_2.Services.IHangHoaExcelService, BTL_LTW_QuanLiKho_2.Services.HangHoaExcelService>();

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
