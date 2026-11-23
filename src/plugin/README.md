# Windows & Office · Tiếng Việt

Plugin local cho Antigravity App 2.34.0+: công cụ điều khiển Windows và trình xem PDF/DOCX/XLSX/PPTX trong tab tệp.

Bấm **Office Preview** dưới mục **Tiện ích** ở thanh bên, rồi **Chọn tài liệu**. Tệp tối đa 10 MiB; chỉ xem, không chỉnh sửa, không chạy macro. DOCX có thể khác bố cục Word. XLSX xem tối đa 2000 hàng, 100 cột và 20.000 ô mỗi sheet, công thức dùng kết quả đã lưu, không tính lại hoặc hiển thị biểu đồ. PPTX xem nhẹ chữ/ảnh, chưa tái tạo đầy đủ theme, SmartArt, biểu đồ, animation. Thứ tự slide được đọc từ presentation.

Bộ cài EXE đầy đủ từ 2.1.2 bổ sung preview trực tiếp trong khung tệp gốc bằng hook tương thích ASAR. Riêng ZIP plugin rời vẫn dùng trang/panel Office Preview; không tự cài hook ASAR.

Ví dụ yêu cầu: “Liệt kê cửa sổ Windows đang mở”, “Quan sát cửa sổ Notepad rồi nhập dòng Xin chào”. Agent cần quan sát lại trước mỗi thao tác; tọa độ tính theo pixel cửa sổ gốc.

Các công cụ Windows có thể đổi trạng thái máy. Chỉ giao nhiệm vụ bạn muốn thực hiện và giữ chế độ xét duyệt công cụ phù hợp trong Antigravity. Khi dùng, trạng thái/ảnh màn hình có thể được gửi cho mô hình đang chọn của Antigravity; đây không phải mô hình điều khiển chạy offline. Bộ dịch tiếng Việt và xử lý file preview chạy local.

Plugin không có API key riêng, không mở HTTP server, không ghi nội dung màn hình vào log và không tạo dịch vụ nền. Tắt công cụ Windows trong trang MCP của plugin để chỉ dùng Office Preview. Chưa điều khiển được màn hình khóa/UAC hoặc cửa sổ chạy quyền cao hơn tiến trình công cụ.

Bộ đầy đủ 2.2.0 cài thêm AutoCAD MCP Pro và Computer Use; riêng ZIP plugin không chứa các runtime này. Xem docs/INTEGRATED-SETUP.md trong repository.
