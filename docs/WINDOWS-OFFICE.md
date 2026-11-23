# Windows MCP và Office Preview (2.2.0)

Bộ 2.2.0 cài thêm **AutoCAD MCP** và **Computer Use**. Xem [hướng dẫn tích hợp đầy đủ](INTEGRATED-SETUP.md).

## Cài trên máy khác

1. Máy cần Windows 10/11 x64 và **Antigravity App desktop 2.34.0+**, không phải bản IDE dựa trên VS Code.
2. Tải `Antigravity-Tieng-Viet-Setup-x64-v2.2.0.exe` từ Releases. Không cần tải payload hoặc cài Node/Python riêng.
3. Lưu công việc và thoát hẳn Antigravity, kể cả khay hệ thống.
4. Chạy bộ cài, chọn thư mục chứa `Antigravity.exe`, bấm **Cài đặt**.
5. Mở **Antigravity tiếng Việt** trên Desktop.
6. Vào **Tùy chỉnh (Customizations) → Đã cài (Installed) → Antigravity tiếng Việt · Windows & Office → MCP**. Hai server `office-preview` và `windows-control` cần ở trạng thái **Ready**. Công cụ file viewer bị ẩn khỏi mô hình theo giao thức, nên số công cụ hiện trong UI có thể thấp hơn tổng số được đăng ký.

Bộ cài thêm plugin cho tài khoản Windows hiện tại, giữ các plugin/MCP khác. Thư mục plugin: `%USERPROFILE%\.gemini\config\plugins\antigravity-vietnamese-tools`. Runtime/mô hình dịch: `%LOCALAPPDATA%\AntigravityVietnamese`.

## Điều khiển máy bằng tiếng Việt

Trong chat mới, yêu cầu cụ thể, ví dụ:

> Dùng công cụ windows_list để liệt kê các cửa sổ đang mở.

> Quan sát cửa sổ Notepad, rồi nhập dòng “Xin chào Việt Nam”. Không lưu tệp.

> Mở File Explorer và xem thư mục Downloads. Chưa xóa hoặc di chuyển tệp.

Plugin cung cấp danh sách cửa sổ, cây UI Automation, ảnh màn hình, click trái/phải/đúp, nhập Unicode, tổ hợp phím, cuộn và mở tệp `.exe` có sẵn. Mỗi thao tác cần quan sát cửa sổ trước, trạng thái hết hạn sau 30 giây hoặc sau một thao tác. Cửa sổ phải được đưa lên trước; công cụ sẽ từ chối khi không xác nhận được focus hoặc tọa độ bị cửa sổ khác che.

Đây là MCP do dự án xây bằng Node.js và C#/.NET Framework, **không phải bản đóng gói CursorTouch/Windows-MCP**. Không gọi GPT riêng: mô hình đang chọn trong Antigravity suy luận và gọi các công cụ này. Chưa hỗ trợ drag, OCR riêng, màn hình khóa/UAC hoặc điều khiển ứng dụng có quyền cao hơn.

### Quyền riêng tư và quyền thao tác

Ảnh màn hình và nội dung UI được trả cho agent và có thể gửi tới mô hình/dịch vụ của Antigravity. Chỉ phần dịch giao diện và xử lý preview chạy local; không gọi toàn bộ tính năng điều khiển là offline. Plugin không tự xin API key hoặc tạo listener mạng.

Giữ chế độ duyệt công cụ phù hợp với công việc. Không đưa mật khẩu/OTP hoặc thao tác tài khoản nhạy cảm vào bài thử. Không thể bảo đảm agent luôn chọn đúng nút; quan sát lúc thao tác quan trọng. Bộ cài không đổi thiết lập quyền của Antigravity sang “cho phép tất cả”.

## Xem PDF/DOCX/XLSX/PPTX trong tab

Cách mặc định từ bộ cài EXE **2.2.0**: bấm tệp local trong hội thoại để xem ngay trong tab tệp ở khung bên phải. Không phải mở trang Office Preview hoặc chọn lại file. Đã kiểm tra trực tiếp với tệp Word tiếng Việt và tab khôi phục từ phiên cũ trên App 2.34.0.

Khi viewer mặc định báo không hỗ trợ, hook tương thích sẽ đọc đúng file của tab đang được chọn và hiển thị tại chỗ trong iframe cách ly. Chỉ nhận PDF/DOCX/XLSX/PPTX local tối đa 10 MiB; không đọc URL web, UNC/network share hoặc loại tệp khác. Không truyền đường dẫn tùy ý từ trang sang main process. Nội dung không gửi tới mô hình hoặc dịch vụ preview ngoài.

Trang Office Preview ở thanh bên vẫn dùng được để chọn một tệp khác thủ công. ZIP plugin rời chỉ cung cấp trang/panel này; cần EXE đầy đủ để cài hook preview trong khung gốc. Nếu vẫn thấy thông báo cũ sau nâng cấp, thoát hẳn App và mở qua shortcut Antigravity tiếng Việt; kiểm tra đã dùng EXE 2.2.0, không chỉ ZIP. Cấu trúc/phiên bản App tương lai có thể cần bản tương thích mới.

| Loại | Hỗ trợ | Giới hạn |
| --- | --- | --- |
| PDF | Chuyển trang, phóng to 75–200%, vừa chiều ngang, xem văn bản trang | Không chỉnh sửa/điền form, không OCR, chưa nhập mật khẩu; một số font/codec đặc biệt có thể không hiển thị đầy đủ |
| DOCX | Chữ, bảng, ảnh, bố cục trang qua docx-preview | Phông/ngắt trang/trường động có thể khác Word; không bảo đảm đúng bản in |
| XLSX | Chuyển sheet, chữ/số, định dạng cơ bản, ô gộp, xem công thức bằng tooltip | Không tính lại công thức; dùng kết quả đã lưu, chưa có biểu đồ; tối đa 2000 hàng, 100 cột và 20.000 ô/sheet |
| PPTX | Trang slide với chữ và ảnh raster cơ bản | Chưa tái tạo đầy đủ theme, shape, SmartArt, biểu đồ, animation; bản xem nhẹ, không thay PowerPoint |

Chỉ xem, không chỉnh sửa hoặc lưu đè. Không chạy macro. Tệp đọc qua host giới hạn **10 MiB**; với tệp Office dạng ZIP, tổng kích thước giải nén bị giới hạn 64 MiB và 5000 mục. Tệp mã hóa, hỏng hoặc quá lớn sẽ báo lỗi. Chưa hỗ trợ định dạng cũ `.doc`, `.xls`, `.ppt`, tệp macro `.docm`, `.xlsm`, `.pptm`.

Để xem đúng bản in, mở bằng Word/Excel/PowerPoint hoặc xuất PDF. Không cần tải tài liệu lên Google Docs/Office Online cho preview này.

## Tắt/gỡ từng phần

- **Chỉ dùng preview:** trong tab MCP của plugin, mở menu của `windows-control` để tắt server hoặc tắt các công cụ Windows. Giữ `office-preview` hoạt động.
- **Tắt/gỡ cả hai:** dùng menu plugin ở **Tùy chỉnh → Đã cài** và chọn Disable/Uninstall tương ứng. Có thể dùng `agy plugin disable antigravity-vietnamese-tools` / `agy plugin uninstall antigravity-vietnamese-tools` nếu máy có CLI.
- **Khôi phục giao diện tiếng Anh:** dùng shortcut **Khôi phục giao diện gốc** như README. Thao tác này khôi phục ASAR, tắt Việt hóa và preview trực tiếp, không gỡ plugin; cần tắt/gỡ plugin riêng.
- Cài lại bộ 2.1.0 sẽ đăng ký lại plugin. Nếu không muốn plugin sau lần nâng cấp, tắt/gỡ lại trong Antigravity.

## Khi có lỗi

- Không thấy plugin: kiểm tra đúng tài khoản Windows đã chạy bộ cài; thoát hẳn và mở lại App.
- MCP báo lỗi khởi động: mở menu server → Restart; kiểm tra antivirus có cách ly `WindowsBridge.exe` hay `server.cjs` không. Không vô hiệu hóa antivirus; kiểm tra SHA-256 và báo lỗi.
- Preview không mở: dùng **Office Preview → Chọn tài liệu**; kiểm tra kích thước/định dạng. Với viewer tự động, plugin khác đăng ký cùng phần mở rộng có thể được ưu tiên trước; cơ chế này chưa được bảo đảm trên mọi bản App.
- Không nhập/bấm được: quan sát lại, kiểm tra cửa sổ bị che, focus, phiên Windows có màn hình đang hoạt động và mức quyền của ứng dụng. Không tăng quyền toàn bộ công cụ chỉ để thử.
- Báo lỗi bằng phiên bản App/Windows/bộ cài và bước tái hiện. Không đăng ảnh chứa dữ liệu riêng, cache hoặc toàn bộ cấu hình MCP.

### PDF từ 2.1.1

Dùng Office Preview → Chọn tài liệu → chọn `.pdf`. Bấm Trang trước/Trang sau, chọn mức zoom; mở “Văn bản trang hiện tại” để sao chép nội dung PDF có text. PDF scan chỉ hiển thị ảnh, không tự OCR. PDF mã hóa cần mật khẩu và tệp hỏng sẽ báo lỗi. Tối đa 10 MiB. PDF.js được đóng gói local, không tải worker từ CDN, không chạy JavaScript/annotation action trong PDF. Chỉ giữ canvas trang hiện tại và giải phóng tài liệu cũ khi đổi file.
