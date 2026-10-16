using System;

namespace BTL_LTW_QuanLiKho_2.Helpers;

/// <summary>
/// DateRangeHelper – Tiện ích tính toán dải ngày (FromDate, ToDate) chuẩn KiotViet dùng chung toàn hệ thống.
/// Hỗ trợ cả các bộ lọc danh mục và bộ lọc chứng từ (Hàng hóa, Kiểm kho, Nhập kho, Xuất kho, Báo cáo...).
/// </summary>
public static class DateRangeHelper
{
    public static (DateTime fromDate, DateTime toDate) Resolve(string? filterType, DateTime? customFrom = null, DateTime? customTo = null)
    {
        var now = DateTime.Now;
        var today = now.Date;

        var key = (filterType ?? "").Trim().ToUpper();

        return key switch
        {
            "ALL" or "TOANTHOIGIAN" or "TOAN_THOI_GIAN" => 
                (new DateTime(2000, 1, 1), now.AddYears(10)),

            "TODAY" or "HOMNAY" or "HOM_NAY" => 
                (today, today.AddDays(1).AddTicks(-1)),

            "YESTERDAY" or "HOMQUA" or "HOM_QUA" => 
                (today.AddDays(-1), today.AddTicks(-1)),

            "THIS_WEEK" or "TUANNAY" or "TUAN_NAY" =>
                (GetStartOfWeek(today), GetStartOfWeek(today).AddDays(7).AddTicks(-1)),

            "LAST_WEEK" or "TUANTRUOC" or "TUAN_TRUOC" =>
                (GetStartOfWeek(today).AddDays(-7), GetStartOfWeek(today).AddTicks(-1)),

            "LAST_7_DAYS" or "7NGAY" or "7_NGAY" => 
                (today.AddDays(-6), now),

            "THIS_MONTH" or "THANGNAY" or "THANG_NAY" => 
                (new DateTime(now.Year, now.Month, 1), new DateTime(now.Year, now.Month, 1).AddMonths(1).AddTicks(-1)),

            "LAST_MONTH" or "THANGTRUOC" or "THANG_TRUOC" =>
                (new DateTime(now.Year, now.Month, 1).AddMonths(-1), new DateTime(now.Year, now.Month, 1).AddTicks(-1)),

            "LAST_30_DAYS" or "30NGAY" or "30_NGAY" => 
                (today.AddDays(-29), now),

            "THIS_QUARTER" or "QUYNAY" or "QUY_NAY" =>
                (new DateTime(now.Year, ((now.Month - 1) / 3) * 3 + 1, 1),
                 new DateTime(now.Year, ((now.Month - 1) / 3) * 3 + 1, 1).AddMonths(3).AddTicks(-1)),

            "LAST_QUARTER" or "QUYTRUOC" or "QUY_TRUOC" =>
                (new DateTime(now.Year, ((now.Month - 1) / 3) * 3 + 1, 1).AddMonths(-3),
                 new DateTime(now.Year, ((now.Month - 1) / 3) * 3 + 1, 1).AddTicks(-1)),

            "THIS_YEAR" or "NAMNAY" or "NAM_NAY" => 
                (new DateTime(now.Year, 1, 1), new DateTime(now.Year, 12, 31, 23, 59, 59)),

            "LAST_YEAR" or "NAMTRUOC" or "NAM_TRUOC" => 
                (new DateTime(now.Year - 1, 1, 1), new DateTime(now.Year - 1, 12, 31, 23, 59, 59)),

            "CUSTOM" or "TUY_CHINH" =>
                (customFrom.HasValue ? customFrom.Value.Date : new DateTime(now.Year, now.Month, 1),
                 customTo.HasValue ? customTo.Value.Date.AddDays(1).AddTicks(-1) : now),

            _ => customFrom.HasValue || customTo.HasValue
                ? (customFrom.HasValue ? customFrom.Value.Date : new DateTime(2000, 1, 1),
                   customTo.HasValue ? customTo.Value.Date.AddDays(1).AddTicks(-1) : now)
                : (new DateTime(2000, 1, 1), now.AddYears(10))
        };
    }

    private static DateTime GetStartOfWeek(DateTime date)
    {
        int diff = (7 + (date.DayOfWeek - DayOfWeek.Monday)) % 7;
        return date.AddDays(-diff);
    }
}
