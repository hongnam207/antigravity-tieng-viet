# Windows & Office · Tiếng Việt

Plugin local cho Antigravity App 2.34.0+: công cụ điều khiển Windows và trình xem PDF/DOCX/XLSX/PPTX trong tab tệp.

Bấm **Office Preview** dưới mục **Tiện ích** ở thanh bên, rồi **Chọn tài liệu**. Tệp tối đa 10 MiB; chỉ xem, không chỉnh sửa, không chạy macro. DOCX có thể khác bố cục Word. XLSX xem tối đa 2000 hàng, 100 cột và 20.000 ô mỗi sheet, công thức dùng kết quả đã lưu, không tính lại hoặc hiển thị biểu đồ. PPTX xem nhẹ chữ/ảnh, chưa tái tạo đầy đủ theme, SmartArt, biểu đồ, animation hoặc thứ tự slide tùy chỉnh.

Có đăng ký viewer theo đuôi tệp nhưng tự thay viewer ở tab file cũ chưa ổn định trên App 2.34.0 đã thử; dùng trang Office Preview ở thanh bên nếu tab mặc định vẫn báo không hỗ trợ.

Ví dụ yêu cầu: “Liệt kê cửa sổ Windows đang mở”, “Quan sát cửa sổ Notepad rồi nhập dòng Xin chào”. Agent cần quan sát lại trước mỗi thao tác; tọa độ tính theo pixel cửa sổ gốc.

Các công cụ Windows có thể đổi trạng thái máy. Chỉ giao nhiệm vụ bạn muốn thực hiện và giữ chế độ xét duyệt công cụ phù hợp trong Antigravity. Khi dùng, trạng thái/ảnh màn hình có thể được gửi cho mô hình đang chọn của Antigravity; đây không phải mô hình điều khiển chạy offline. Bộ dịch tiếng Việt và xử lý file preview chạy local.

Plugin không có API key riêng, không mở HTTP server, không ghi nội dung màn hình vào log và không tạo dịch vụ nền. Tắt công cụ Windows trong trang MCP của plugin để chỉ dùng Office Preview. Chưa điều khiển được màn hình khóa/UAC hoặc cửa sổ chạy quyền cao hơn tiến trình công cụ.
