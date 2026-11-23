# Xử lý lỗi

## Antigravity vẫn đang chạy

Lưu công việc, thoát ứng dụng và biểu tượng ở khay hệ thống rồi cài lại. Không kết thúc Python không rõ nguồn gốc.

## Bản vá chưa có hồ sơ sao lưu tương ứng

Ứng dụng đã có bản vá nhưng thiếu `state.json` và bản gốc tương ứng. Nếu dùng bộ rời, bấm **Chọn bộ Việt hóa cũ**, chọn thư mục chứa `state.json` và `backups`. Không xóa dấu bản vá hoặc sửa hash để ép cài. Nếu mất backup, cài lại ứng dụng Antigravity gốc trước khi cài bộ dịch.

## Không hỗ trợ cấu trúc

Kiểm tra đúng bản desktop Electron, không phải IDE dựa trên VS Code. Gửi phiên bản và thông báo lỗi qua Issues. Chưa bảo đảm mọi phiên bản.

## Còn tiếng Anh hoặc dịch sai

Mở từ shortcut tiếng Việt, chờ câu mới dịch xong. Nhãn khó phân biệt với dữ liệu người dùng có thể bị bỏ qua. Nhãn một từ chưa có trong từ điển và tên mô hình được giữ nguyên. Báo nhãn, vị trí và bản dịch mong muốn qua Issues/PR; che dữ liệu riêng trong ảnh.

## Xóa cache

Thoát Antigravity rồi xóa riêng `%LOCALAPPDATA%\AntigravityVietnamese\cache\translations.json`. Không xóa `state.json` hoặc `backups`. Bản dịch được tạo lại khi cần.

## Kiểm tra RAM

Task Manager → Details → bật Image path name. Chỉ kiểm tra Python ở thư mục bộ Việt hóa. Tiến trình phải thoát khi hết việc; RAM Antigravity là phần riêng. Nếu worker ở lại lâu lúc không thao tác, báo phiên bản và trạng thái `runtime-status.json`; không gửi cache.

## Dòng lệnh

Sau khi thoát Antigravity:

```powershell
& "$env:LOCALAPPDATA\AntigravityVietnamese\AntigravityVietnamese.exe" --status
& "$env:LOCALAPPDATA\AntigravityVietnamese\AntigravityVietnamese.exe" --restore
```
