# Changelog

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
