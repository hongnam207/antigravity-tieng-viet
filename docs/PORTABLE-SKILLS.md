# Skills chuyển đổi và đồng bộ từ Codex

Bản 2.3.0 cài sẵn 40 skill có tiền tố `agy-`, gồm 20 workflow và thành phần hỗ trợ, cùng 20 mẫu Office của dự án. Có thể cài trên máy chỉ có Antigravity, không cần Codex hoặc Python riêng.

## Dùng sau khi cài

Mở một cuộc trò chuyện mới trong Antigravity rồi gọi skill, chẳng hạn:

```text
/agy-documents Tạo tài liệu Word tiếng Việt có tiêu đề, bảng và số trang.
/agy-spreadsheets Tạo bảng ngân sách có công thức và định dạng tiền tệ.
/agy-presentations Tạo bài trình chiếu 5 slide theo nội dung tôi cung cấp.
/agy-pdf Tạo PDF tiếng Việt rồi render để kiểm tra font.
```

Các skill nằm trong `%USERPROFILE%\.gemini\config\skills`. Runtime Office/PDF và các phụ thuộc được đóng gói cùng bộ cài. Khi chưa có Python của skill, bộ cài tạo interpreter cục bộ tại `agy-local-runtime\.venv\Scripts\python.exe` dùng thư viện đi kèm. Nếu bạn đã có interpreter ở đó, bộ cài giữ nguyên và ghi nhận trong báo cáo.

Những skill đã có hoặc đã được sửa riêng được giữ nguyên khi nâng cấp. Bộ cài không thay tệp mẫu của bạn bằng mẫu mặc định. Các mẫu phân phối công khai là mẫu do dự án tạo theo MIT, không phải bản sao giao diện mẫu OpenAI. Script đồng bộ có thể lưu lại skill và tài nguyên gốc từ chính máy bạn trong thư mục sao lưu.

## Đồng bộ lại skills và MCP

Trong **Start → Antigravity tiếng Việt**, mở **Đồng bộ skills và MCP từ Codex**. Bạn cũng có thể chạy:

```powershell
& "$env:LOCALAPPDATA\AntigravityVietnamese\AntigravityVietnamese.exe" --sync-skills
```

Thao tác này đọc `.agents\skills`, `.codex\skills`, cache plugin đã cài và `.codex\config.toml` trên máy đang chạy. Không lấy hàng trăm skill trong `.codex\.tmp`, không tải lịch sử chat, không sao chép cấu hình từ máy tác giả. Kết quả và bản sao lưu nằm trong `%USERPROFILE%\.gemini\codex-sync`.

Script giữ nguyên các MCP hiện có và các khóa cấu hình khác. Chỉ thêm mục MCP có thể chuyển được; không biến dịch vụ riêng của GPT thành MCP công khai. Các giá trị `env` hoặc header cần thiết trong cấu hình được sao chép cục bộ; không chia sẻ thư mục sao lưu nếu có thông tin xác thực. Bản skill có phụ thuộc chưa chuyển được được đưa vào khu vực cần kiểm tra. Nếu báo xung đột, hãy xem `report.json` và so sánh hai bản; script không ghi đè bản bạn đã sửa.

Bản PowerShell độc lập cũng nằm trong `integrations\portable-skills\pack\Sync-Portable-Skills.ps1`. Khi dùng bản này riêng ngoài bộ cài, cần Python 3.11+ và PyYAML; lựa chọn `-InstallDependencies` tải thư viện qua Internet. Dùng mục trong Start thì tận dụng runtime đã đóng gói.

## Khả năng và giới hạn

| Nhóm | Chức năng sau chuyển đổi |
| --- | --- |
| Word, Excel, PowerPoint, PDF | Tạo và đọc tệp bằng thư viện cục bộ; PDF có render ảnh |
| Điều khiển Windows | Dùng MCP desktop thực sự được kết nối; không gọi API riêng của GPT |
| Excel đang mở | Cần Excel MCP có khả năng tương ứng hoặc Excel COM với pywin32; đọc tệp không đồng nghĩa điều khiển phiên Excel đang mở |
| Tạo ảnh, lịch | Dùng công cụ gốc thực sự có trong phiên Antigravity |
| Biểu đồ và tương tác | Xuất HTML hoặc ảnh; không hứa có widget chat giống GPT |
| Pages và Spaces | Thay bằng Markdown và thư mục cục bộ; không truy cập tài khoản ChatGPT |
| Sites | Phát triển web cục bộ; hosting cần tích hợp riêng |
| Pet ChatGPT, statusline Codex | Không kích hoạt vì không có dịch vụ tương đương trong gói |

Không có tiến trình mô hình được giữ thường trú bởi các skill này. Office/PDF chỉ chạy khi agent gọi. Công cụ tạo ảnh hoặc điều khiển desktop vẫn tuân theo quyền và dịch vụ của phiên Antigravity.

openpyxl không tính công thức. Render DOCX/XLSX/PPTX bằng helper cần LibreOffice được cài riêng hoặc công cụ Office thực sự có sẵn. Preview trong khung bên phải là thành phần khác, vẫn xem được các định dạng hỗ trợ mà không cần LibreOffice. Các đối tượng Office nâng cao cần kiểm tra độ trung thực khi chỉnh sửa.

## AutoCAD MCP và node_repl

Bộ cài nhận diện mục `autocad` dùng đúng lệnh `uvx autocad-mcp-pro` hoặc phiên bản `==1.8.0`, sao lưu cấu hình rồi chuyển sang Python và máy chủ đi kèm. Các giá trị `env`, `cwd`, backend và thiết lập riêng được giữ lại. Mục dùng lệnh tùy chỉnh khác được giữ nguyên. Máy không có AutoCAD dùng backend DXF; máy có AutoCAD có thể dùng COM. Việc máy chủ khởi động thành công chưa chứng minh các thao tác CAD đều chạy được.

`node-code-sandbox-mcp` cần Docker đang chạy. Bộ cài không tự cài Docker hoặc tự bật daemon. Đây là MCP khác với JavaScript REPL nội bộ của GPT.

## Kiểm chứng bản phát hành

Kiểm tra tự động dùng hồ sơ riêng để cài/reuse 40 skill, giữ chỉnh sửa người dùng và tạo/mở lại DOCX/XLSX/PPTX/PDF bằng interpreter đóng gói; kiểm tra PDF render và 20 đường dẫn tệp mẫu. Kiểm tra MCP CAD thực hiện handshake, tạo/lưu DXF và chụp ảnh DXF trong môi trường thử, không sửa bản vẽ người dùng.

Trên Antigravity App 2.34.0, đã thử các workflow tạo DOCX/XLSX/PPTX/PDF; Fetch, Excel đọc ô, MarkItDown, Playwright và Windows liệt kê cửa sổ. Sau khi sửa launcher, AutoCAD MCP trả kết quả cho `describe_tool` và `search_tools`. Chưa kiểm chứng mọi skill, mọi chức năng CAD hoặc mọi phiên bản Antigravity.

Tài liệu đối chiếu: [Skills](https://antigravity.google/docs/skills), [MCP](https://antigravity.google/docs/mcp), [Schedule](https://antigravity.google/docs/commands/schedule/) và [Automation](https://antigravity.google/docs/commands/automation/).
