namespace BTL_LTW_QuanLiKho_2.ViewModels;

/// <summary>
/// Chuẩn hóa định dạng phản hồi JSON cho toàn bộ Controller/AJAX trong hệ thống.
/// Định dạng: { success: true/false, message: "...", data: ... }
/// </summary>
public class ApiResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public object? Data { get; set; }

    public ApiResponse() { }

    public ApiResponse(bool success, string message, object? data = null)
    {
        Success = success;
        Message = message;
        Data = data;
    }

    public static ApiResponse Ok(string message = "Thành công", object? data = null)
        => new(true, message, data);

    public static ApiResponse Fail(string message, object? data = null)
        => new(false, message, data);
}

/// <summary>
/// Phản hồi JSON có kiểu dữ liệu generic cho Data.
/// </summary>
/// <typeparam name="T">Kiểu dữ liệu trả về trong Data</typeparam>
public class ApiResponse<T>
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public T? Data { get; set; }

    public ApiResponse() { }

    public ApiResponse(bool success, string message, T? data = default)
    {
        Success = success;
        Message = message;
        Data = data;
    }

    public static ApiResponse<T> Ok(T data, string message = "Thành công")
        => new(true, message, data);

    public static ApiResponse<T> Fail(string message, T? data = default)
        => new(false, message, data);
}
