# Cấu hình các MCP tiện ích

Bộ cài đầy đủ tự cài AutoCAD MCP, Windows MCP, Office Preview và Computer Use. Các MCP Fetch, Excel, MarkItDown, Playwright và Node sandbox được cung cấp thêm dưới dạng script cấu hình tùy chọn; không phân phối sẵn toàn bộ runtime của năm máy chủ này.

Bạn cần `uvx` cho các server Python, `npx` cho JavaScript và Internet khi tải gói lần đầu. Node sandbox cần Docker daemon đang chạy. Playwright cần trình duyệt được hỗ trợ. Script chỉ bổ sung cấu hình, không tự cài những điều kiện này và không tự đổi quyền duyệt công cụ.

## Xem trước và áp dụng

Sau khi cài EXE, mở PowerShell:

```powershell
$bundle = "$env:LOCALAPPDATA\AntigravityVietnamese"
& "$bundle\node.exe" "$bundle\integrations\extra-mcps\configure.cjs"
& "$bundle\node.exe" "$bundle\integrations\extra-mcps\configure.cjs" --apply
```

Script giữ nguyên server đã có, kể cả `env` và tham số riêng. Các mục còn thiếu được bổ sung với phiên bản cố định: Fetch 2026.11.18, Excel 2.3.3, MarkItDown MCP 0.0.1a8, Playwright MCP 0.0.86 và Node sandbox 1.3.0. Cấu hình cũ được sao lưu với tên riêng trước khi ghi. Mở lại Antigravity để nạp thay đổi, rồi thử từng tool trong phạm vi an toàn.

Kiểm tra thực tế trước phát hành đã chạy Fetch, Excel đọc ô, MarkItDown và Playwright trên máy phát triển. Node sandbox báo Docker đang tắt nên chưa kiểm chứng khả năng thực thi mã. Các cấu hình tùy chọn được kiểm tra khả năng merge và giữ dữ liệu; khả năng khởi chạy trên máy khác phụ thuộc những điều kiện nêu trên.

Nếu bạn đã dùng các server này trên máy, không cần chạy lại script. Không chép nguyên cấu hình người khác vì có thể chứa đường dẫn và thông tin xác thực riêng.
