# Chuyển skill Codex sang Antigravity

Bộ này gồm 40 skill đã viết lại để dùng quy trình của Antigravity hoặc thư viện chạy trên máy, trong đó có 20 mẫu Office do dự án tạo theo MIT. Không phân phối lại tệp mẫu gốc của OpenAI. Script đi kèm đồng bộ các bản chuyển đổi và bổ sung cấu hình MCP có thể chuyển được, đồng thời giữ nguyên các MCP đã có.

Với bộ cài đầy đủ 2.3.0, runtime và thư viện Office/PDF đã có sẵn. Mở mục Đồng bộ skills và MCP từ Codex trong Start để dùng runtime đi kèm. Hướng dẫn dưới đây dành cho script PowerShell độc lập. Xem tài liệu docs/PORTABLE-SKILLS.md của repository để biết cách cài tích hợp và giới hạn.

Đây là bản chuyển đổi quy trình, không phải bản sao toàn bộ dịch vụ của ChatGPT. Công cụ điều khiển Windows, Excel đang mở, tạo ảnh và lịch tự động vẫn cần có sẵn trong phiên Antigravity. Không có công cụ tương ứng thì skill sẽ báo thiếu chức năng.

## Cài đặt

1. Giải nén toàn bộ gói. Giữ `Sync-Portable-Skills.ps1`, `sync_engine.py`, các tệp JSON và thư mục `skills` cùng nhau.
2. Mở PowerShell trong thư mục vừa giải nén. Cần Python 3.11 trở lên và PyYAML. Máy đang dùng đã có hai thành phần này. Nếu máy khác thiếu PyYAML, chạy:

   ```powershell
   python -m pip install PyYAML==6.0.3
   ```

3. Xem kế hoạch trước khi áp dụng:

   ```powershell
   powershell -NoProfile -ExecutionPolicy Bypass -File .\Sync-Portable-Skills.ps1
   ```

4. Đồng bộ và cài thư viện Office/PDF vào môi trường Python riêng:

   ```powershell
   powershell -NoProfile -ExecutionPolicy Bypass -File .\Sync-Portable-Skills.ps1 -Apply -InstallDependencies
   ```

   Bước cài thư viện cần Internet, tải gói từ PyPI và không cài chúng vào Python toàn hệ thống. Không có tiến trình mô hình dịch hay máy chủ MCP mới được chạy ngầm bởi bộ này.

5. Mở lượt trò chuyện mới trong Antigravity, nhập `/agy-documents`, `/agy-spreadsheets`, `/agy-presentations` hoặc tên skill tương ứng. Nếu danh sách chưa hiện, mở lại trang tùy chỉnh hoặc khởi động lại Antigravity.

Chỉ muốn đồng bộ, chưa cài thư viện: dùng `-Apply` mà không thêm `-InstallDependencies`. `-ExecutionPolicy Bypass` chỉ áp dụng cho tiến trình PowerShell vừa mở, không thay đổi chính sách toàn máy.

## Những phần được chuyển đổi

| Nhóm | Cách hoạt động sau chuyển đổi |
| --- | --- |
| DOCX, XLSX, PPTX, PDF | Thư viện Python cục bộ; có helper đọc cấu trúc, sao chép mẫu và render |
| 20 mẫu Office | Giữ nguyên tệp tham chiếu, chỉnh bản sao bằng thư viện phù hợp |
| Điều khiển Windows | Dùng MCP điều khiển desktop thực sự được kết nối và schema của nó |
| Excel đang mở | Dùng Excel MCP, desktop MCP hoặc Excel COM nếu đã có pywin32 và Excel |
| Tạo ảnh | Dùng công cụ tạo ảnh thực sự có trong phiên Antigravity |
| Biểu đồ, tương tác | Xuất HTML cục bộ hoặc biểu đồ tĩnh; xem bằng trình duyệt có sẵn |
| Pages và Spaces | Thay bằng tệp Markdown và thư mục kiến thức cục bộ; không truy cập tài khoản ChatGPT |
| Hẹn giờ | Dùng quy trình `/schedule` hoặc `/automation` của Antigravity khi có chức năng tương ứng |
| Sites và remix | Phát triển dự án web cục bộ; không kèm dịch vụ hosting của ChatGPT |
| Tạo, cài skill và quản lý tích hợp | Dùng đường dẫn skill và cấu hình MCP của Antigravity |

Danh sách đầy đủ, nguồn gốc và các phụ thuộc nằm trong `manifest.json`. Ba skill quản lý pet của ChatGPT và skill cấu hình statusline riêng cho Codex không được kích hoạt vì không có chức năng tương đương trong gói này.

## Script thay đổi gì

- Cài các skill mới với tiền tố `agy-` vào `%USERPROFILE%\.gemini\config\skills`.
- Quét skill trong `.agents\skills`, `.codex\skills` và cache plugin đã cài. Không lấy hàng trăm skill từ thư mục tạm `.codex\.tmp`.
- Skill nguồn đã có bản chuyển đổi không được kích hoạt thêm dưới dạng bản gốc phụ thuộc GPT. Các skill còn lại chỉ được kích hoạt nếu bộ kiểm tra chưa phát hiện phụ thuộc đặc biệt; điều này chưa chứng minh chúng hoạt động đầy đủ.
- Chỉ những bản skill cũ trùng hoàn toàn với nguồn đã nhận diện mới được chuyển vào bản sao lưu để tránh gọi nhầm. Script nhận diện cả bản đã đổi tên bởi script đồng bộ trước. Bản có chỉnh sửa riêng hoặc thêm tệp được giữ nguyên. Thêm `-KeepLegacy` nếu muốn giữ tất cả bản cũ trong thư mục đang hoạt động.
- Không sửa thư mục builtin. Những bản cũ từng được chép thủ công vào builtin vẫn có thể xuất hiện; gọi rõ tên `/agy-...` để chọn bản chuyển đổi.
- Không ghi đè skill `agy-...` khác nội dung đang cài. Nếu gặp xung đột, script báo chưa hoàn tất để bạn so sánh hai bản.
- MCP được đọc từ `.codex\config.toml` rồi bổ sung vào `mcpServers`; giữ nguyên các mục hiện có và các khóa cấu hình khác. Không tự thay thế dịch vụ nội bộ, cài máy chủ MCP, sao chép phiên đăng nhập hay xác minh tool call.

Bản sao lưu, skill nguồn và `report.json` được lưu theo từng lần chạy tại `%USERPROFILE%\.gemini\codex-sync\<thời điểm>`. Các giá trị `env` hoặc header có sẵn trong cấu hình MCP được sao chép cục bộ nếu mục mới có thể chuyển được; không chia sẻ thư mục sao lưu nếu có thông tin xác thực. Cấu hình MCP cũ được sao lưu trước khi thực sự thay đổi.

Muốn phục hồi một skill bị vô hiệu hóa, tìm thư mục tương ứng trong `legacy-disabled` của lần chạy đó rồi chuyển về thư mục skill cũ nếu đường dẫn đích đang trống. Nếu cần phục hồi MCP, so sánh `mcp_config.before.json` với cấu hình hiện tại để giữ lại những thay đổi mới hơn.

## Kiểm chứng và giới hạn

Đã kiểm tra YAML của cả 40 skill; chế độ xem trước; cài trong hồ sơ giả; cài lại không lồng thư mục; giữ nguyên MCP; sao lưu skill cũ đúng nguồn; giữ bản người dùng đã sửa. Helper đã tạo và mở lại DOCX/XLSX/PPTX, giữ công thức XLSX, trích xuất chữ và render PDF. Các thư viện được cố định phiên bản trong `agy-local-runtime/requirements.txt`.

Máy kiểm tra chưa có LibreOffice nên chưa xác minh render DOCX/XLSX/PPTX. Muốn dùng helper render các định dạng này, cần cài LibreOffice riêng hoặc dùng công cụ Office thực sự có sẵn. Việc mở lại tệp không thay cho kiểm tra bố cục bằng ảnh. openpyxl không tính công thức và có thể không giữ được một số đối tượng Excel nâng cao; chỉnh sửa cần giữ độ trung thực cao phải dùng Excel thật. Không có tuyên bố rằng các mẫu đã được kiểm tra bố cục sau mọi loại chỉnh sửa hoặc rằng mọi MCP đã được kiểm thử trực tiếp.

Có thể kiểm tra runtime sau khi cài:

```powershell
$rt = "$env:USERPROFILE\.gemini\config\skills\agy-local-runtime"
& "$rt\.venv\Scripts\python.exe" "$rt\scripts\office.py" doctor
& "$rt\.venv\Scripts\python.exe" "$rt\scripts\office.py" self-test --out "$env:TEMP\agy-office-test-$([guid]::NewGuid().ToString('N'))"
```

## Tài liệu đối chiếu

- [Antigravity skills](https://antigravity.google/docs/skills)
- [Antigravity MCP](https://antigravity.google/docs/mcp)
- [Schedule](https://antigravity.google/docs/commands/schedule/) và [Automation](https://antigravity.google/docs/commands/automation/)
- [Giới hạn khi đọc và lưu tệp với openpyxl](https://openpyxl.readthedocs.io/en/stable/tutorial.html)
