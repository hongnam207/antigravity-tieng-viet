# Changelog

## 2.3.0 — 2026-11-24

- Cài sẵn 40 skill chuyển đổi, runtime Office/PDF offline và 20 mẫu do dự án tạo theo MIT.
- Thêm shortcut đồng bộ skills và MCP từ Codex trong Start; giữ bản chỉnh sửa riêng và lưu báo cáo theo từng lần chạy.
- Nâng cấp đúng launcher uvx của AutoCAD MCP sang runtime đi kèm, giữ env/cwd và backend. Giữ nguyên lệnh tùy chỉnh khác.
- Giữ preview trong khung tệp, Việt hóa offline, Windows MCP và Computer Use từ 2.2.0.

## 2.2.0

- Sửa XLSX có chart-only drawing làm ExcelJS báo `anchors`; đọc dữ liệu/ô gộp/công thức đã lưu từ bản sao trong RAM, không sửa file gốc. Chưa render biểu đồ/ảnh trong sheet.
- Ngăn phản hồi DOCX/PPTX/XLSX cũ ghi đè file mới; hủy PDF cũ và bảo vệ cập nhật văn bản/render sau khi chuyển tab.
- PPTX đọc thứ tự slide theo presentation relationships. Kiểm tra bốn định dạng trong khung gốc dưới sandbox/CSP.
- Đóng gói AutoCAD MCP Pro 1.8.0 và Python dependencies riêng. Cấu hình mới tự chọn COM nếu AutoCAD đã đăng ký, hoặc ezdxf nếu chưa cài AutoCAD; giữ nguyên mục autocad có sẵn.
- Đóng gói Computer Use 1.0.6 của shayann07 dưới dạng skill trực tiếp + sidecar. Kiểm tra SHA-256 và inventory upstream; cài mới/nâng cấp giữ chế độ quyền hiện có, không đổi Turbo.
- EXE đầy đủ cài các runtime offline sau khi tải; thêm hướng dẫn cài máy khác, ví dụ sử dụng, xử lý lỗi và gỡ từng phần.

## 2.1.2

- Sửa đúng khung preview tệp bên phải: bấm tệp local trong hội thoại để xem ngay, không cần chọn lại.
- Hook chỉ đọc tệp của tab đang được chọn, giới hạn định dạng và 10 MiB; render trong iframe sandbox/CSP không kết nối mạng.
- Giữ nguyên DOM/header của ứng dụng, xử lý chuyển tab và nút tải lại.
- Kiểm tra trực tiếp với tệp Word tiếng Việt trong Antigravity 2.34.0; thêm kiểm tra DOCX/XLSX/PDF trong khung gốc.

## 2.1.1

- Thêm preview PDF local bằng PDF.js, chuyển trang, zoom và văn bản trang.
- PDF chỉ được khởi tạo khi mở; giải phóng tài liệu khi đổi tệp.
- Kiểm tra PDF nhiều trang, chuyển file, tệp hỏng và giới hạn kích thước.


## 2.1.0

- Office Preview: DOCX/XLSX/PPTX, chỉ xem, trong tab bằng plugin chính thức.
- Windows MCP bằng Node/C#; trạng thái UI hết hạn sau mỗi thao tác hoặc 30 giây.
- Hai MCP tách riêng để tắt Windows và giữ preview.
- Bộ cài tự chứa, giữ các cấu hình plugin khác; không cần Node/Python cài riêng cho người dùng.
- Kèm kiểm tra MCP/UI, hướng dẫn máy khác, bật/tắt và giới hạn.

## 2.0.3

- Chỉ nạp mô hình khi có câu chưa có trong từ điển/cache.
- Tắt tiến trình dịch khi xử lý hết lô đang chờ; khởi động lại khi có yêu cầu mới.
- Giữ tên mô hình AI và các bản dịch chuẩn, tránh dịch lại.
- Bộ cài Windows x64 tự chứa, sao lưu và khôi phục.
- Công khai mã nguồn, hướng dẫn, checksum và payload cho nhà phát triển.

## 2.0.2

- Lọc tên mô hình và nhãn đã dịch; không đưa nhãn một từ chưa rõ nghĩa vào mô hình.
