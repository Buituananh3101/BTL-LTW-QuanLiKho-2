using System.Collections.Generic;

namespace BTL_LTW_QuanLiKho_2.ViewModels;

public class ImportHangHoaResult
{
    public bool Success { get; set; }
    public string Message { get; set; } = "";
    public int TotalRows { get; set; }
    public int InsertedCount { get; set; }
    public int UpdatedCount { get; set; }
    public int SkippedCount { get; set; }
    public List<string> Errors { get; set; } = new();
}
