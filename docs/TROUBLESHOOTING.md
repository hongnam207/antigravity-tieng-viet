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

## Không tìm thấy shortcut khôi phục hoặc bấm không thấy phản hồi

Windows có thể không hiện thư mục shortcut ngay trong Start. Thoát hẳn Antigravity, nhấn **Win + R**, dán đường dẫn sau rồi nhấn **Enter**:

```text
%APPDATA%\Microsoft\Windows\Start Menu\Programs\Antigravity tiếng Việt
```

Nhấp đúp **Khôi phục giao diện gốc** trong thư mục vừa mở và chờ thông báo kết quả.

Nếu thiếu thư mục/shortcut, hoặc mở shortcut không thấy thông báo, có thể chạy trực tiếp từ **Win + R**:

```text
"%LOCALAPPDATA%\AntigravityVietnamese\AntigravityVietnamese.exe" --restore
```

Nếu Windows báo không tìm thấy tệp, kiểm tra bộ Việt hóa đã được cài cho tài khoản Windows hiện tại. Không xóa `state.json` hoặc `backups`; nếu cần cài lại bộ dịch, giữ nguyên các tệp này. Nếu hiện thông báo lỗi, gửi nguyên văn lỗi qua Issues sau khi che thông tin riêng.

Sau khi khôi phục thành công, mở bằng shortcut gốc của Antigravity. Shortcut **Antigravity tiếng Việt** sẽ áp dụng lại bản Việt hóa nếu còn tương thích.

## Dòng lệnh

Sau khi thoát Antigravity:

```powershell
& "$env:LOCALAPPDATA\AntigravityVietnamese\AntigravityVietnamese.exe" --status
& "$env:LOCALAPPDATA\AntigravityVietnamese\AntigravityVietnamese.exe" --restore
```
