# Bộ cài tích hợp 2.3.0

Có thêm [40 skill và đồng bộ từ Codex](PORTABLE-SKILLS.md), runtime Office/PDF offline và bản sửa launcher AutoCAD MCP.

## Những gì được cài

| Thành phần | Phiên bản và cách dùng |
|---|---|
| Việt hóa | Từ điển và mô hình Anh–Việt chạy local, chỉ nạp mô hình khi cần dịch |
| Office/PDF Preview | Xem DOCX, XLSX, PPTX, PDF ngay trong khung tệp bên phải |
| AutoCAD MCP Pro | 1.8.0, từ [U-C4N/Autocad-MCP](https://github.com/U-C4N/Autocad-MCP), có bộ chạy Python và phụ thuộc riêng |
| Antigravity Computer Use | 1.0.6, từ [shayann07/antigravity-computer-use](https://github.com/shayann07/antigravity-computer-use), tích hợp **skill `/computer-use` + sidecar** chính thức của dự án |
| Windows MCP | Giữ công cụ `windows-control` của các bản trước để dùng khi cần |

Computer Use bản này **không phải một MCP server cần thêm vào danh sách MCP**. Dự án upstream khuyến nghị dùng skill trực tiếp và sidecar; bộ cài áp dụng cùng cách với lệnh cài một dòng, nhưng đã mang sẵn các tệp có phiên bản cố định và kiểm tra SHA-256. Không thực thi một script `main` thay đổi theo thời gian trên máy người cài.

Bộ cài không kèm ứng dụng/giấy phép Autodesk AutoCAD, Microsoft Office, tài khoản mô hình hoặc API key. Chrome Playwright đã thử ở máy phát triển không thuộc gói tích hợp này.

## Cài mới trên máy khác

1. Chuẩn bị Windows 10/11 **x64**, Antigravity **App desktop Electron** đã cài. Đã kiểm tra họ App 2.34.0; bản IDE dựa trên VS Code không dùng bộ vá này. Dành khoảng **4 GB trống**, nhiều hơn nếu có bản sao lưu/nhiều phiên bản cũ.
2. Mở [Releases](https://github.com/hongnam207/antigravity-tieng-viet/releases/latest), tải **Antigravity-Tieng-Viet-Setup-x64-v2.3.0.exe**. Không cần tải ZIP plugin rời, Python hoặc Node.js.
3. Lưu công việc và thoát hẳn Antigravity. Nếu Computer Use đang thao tác, kết thúc công việc trước. Bộ cài không cưỡng bức dừng tiến trình hoặc xóa trạng thái Stop.
4. Chạy EXE, chọn thư mục chứa `Antigravity.exe`, bấm **Cài đặt**. Chờ thông báo hoàn tất. Chỉ chọn thư mục ứng dụng được hỗ trợ, không chọn thư mục tài liệu.
5. Mở shortcut **Antigravity tiếng Việt** và bắt đầu một cuộc trò chuyện mới.
6. Kiểm tra từng phần theo các mục dưới. Nội dung tệp và thao tác mô hình vẫn cần khả năng/quyền của Antigravity trên máy đó.

Sau khi tải EXE, quá trình cài các runtime, AutoCAD MCP và Computer Use không cần tải thêm gói từ Internet. Việc đăng nhập/sử dụng mô hình Antigravity, cập nhật ứng dụng hoặc website vẫn có thể cần mạng.

Đối chiếu tệp tải về với `SHA256SUMS.txt` trong cùng release:

```powershell
Get-FileHash .\Antigravity-Tieng-Viet-Setup-x64-v2.3.0.exe -Algorithm SHA256
```

Bộ cài cộng đồng chưa có chữ ký số. Không cần đổi ExecutionPolicy hoặc tắt phần mềm bảo vệ để cài.

## Nâng cấp máy đã cài

Thực hiện các bước thoát ứng dụng và chạy EXE mới như trên. Giữ `state.json` và `backups` của bộ Việt hóa. Nếu đang dùng bộ rời cũ, chọn **Chọn bộ Việt hóa cũ…** khi bộ cài yêu cầu hồ sơ sao lưu gốc.

- MCP khác, plugin khác và các trường cấu hình không liên quan được giữ lại.
- Nếu đã có mục `autocad` trong `mcp_config.json`, bộ cài giữ nguyên toàn bộ mục đó, kể cả đường dẫn và engine người dùng chọn. Nó không ép chuyển một cấu hình làm việc sang runtime mới.
- Computer Use đã cài cùng build được kiểm tra và tái sử dụng. Thiết lập quyền hiện có được giữ lại. Nếu phiên bản khác đang chạy, upstream có thể từ chối cập nhật; kết thúc phiên đúng cách và thử lại, không xóa Stop để lách từ chối.
- Bộ Việt hóa/preview có bản sao lưu riêng; Computer Use có cơ chế backup/rollback của upstream. Khôi phục giao diện không tự gỡ các tích hợp khác.

## Kiểm tra preview ngay trong khung tệp

Bấm tệp local DOCX/XLSX/PPTX/PDF từ hội thoại để mở khung bên phải. Sau khi nâng cấp, bấm **↻** trên khung hoặc đóng/mở lại tab tệp. Không cần gọi một tool riêng để xem tệp.

| Định dạng | Đã xử lý trong bản này | Giới hạn |
|---|---|---|
| DOCX | Đọc chữ/bảng/ảnh cơ bản; nội dung cũ không đè tài liệu mới khi chuyển nhanh | Phông chữ, ngắt trang, trường động có thể khác Word |
| XLSX | Bỏ qua phần drawing không hỗ trợ trong bản sao bộ nhớ để tránh lỗi `anchors`; chuyển sheet, ô gộp, định dạng cơ bản và kết quả công thức đã lưu | **Chưa vẽ biểu đồ/ảnh trong sheet**, không tính lại công thức |
| PPTX | Đọc thứ tự slide từ danh sách quan hệ của presentation; giữ chữ/ảnh cơ bản | Không tái tạo đầy đủ theme, nhóm shape, SmartArt, biểu đồ và hiệu ứng |
| PDF | Chuyển trang, zoom, văn bản trang; hủy lượt render cũ khi đổi file | Chưa nhập mật khẩu, OCR, điền form hoặc chạy JavaScript PDF |

Chỉ xem, không ghi đè tệp gốc. Tối đa 10 MiB/tệp; Office ZIP tối đa 64 MiB giải nén và 5000 mục. XLSX giới hạn 100 cột, 2000 hàng, 20.000 ô/sheet. Iframe preview không kết nối mạng; nội dung preview không được tự gửi tới mô hình. Không cam kết hiển thị hoàn toàn như Office; xuất PDF từ Office nếu cần bố cục bản in.

## Dùng AutoCAD MCP

Mở một chat mới rồi nhập:

> Dùng MCP autocad kiểm tra system_status trước. Cho biết engine đang dùng. Tạo một bản vẽ thử mới có hình chữ nhật 100 × 60 đơn vị và một đường tròn ở tâm, bán kính 12. Lưu DXF vào thư mục tôi chỉ định; không ghi đè tệp có sẵn.

MCP mặc định chỉ liệt kê sáu tool gọn. Đây là thiết kế discovery của upstream: dùng `search_tools`, `describe_tool` rồi `call_tool` để tìm/gọi chức năng. Không cần nhìn thấy hơn 250 tool cùng lúc.

**Máy chưa có AutoCAD:** cấu hình mới dùng `auto`; launcher kiểm tra đăng ký `AutoCAD.Application`, chọn `ezdxf` nếu không có. Có thể tạo/đọc/sửa DXF và render ảnh/PDF. Đọc DWG không được bảo đảm: cần đường chuyển đổi được upstream hỗ trợ. Không có AutoCAD thì không có cửa sổ AutoCAD để bấm/điều khiển.

**Máy đã có AutoCAD:** launcher chọn `com` khi ProgID đã đăng ký. Mở AutoCAD, hoàn tất đăng nhập/giấy phép và các hộp thoại khởi động, rồi thử đọc một bản vẽ mới. Bản cài thiếu đăng ký COM, bản LT hoặc ứng dụng CAD khác có thể không tương thích. Không tuyên bố đã kiểm thử live COM trên máy phát triển chưa có AutoCAD.

Muốn ép engine, sửa **riêng** `env.AUTOCAD_MCP_BACKEND` của mục `autocad` trong `%USERPROFILE%\.gemini\config\mcp_config.json` thành `ezdxf`, `com` hoặc `auto`, rồi khởi động lại MCP. Giữ các server khác. Cấu hình có sẵn được bộ cài bảo toàn, nên hãy xem giá trị này nếu nâng cấp mà engine chưa đổi.

## Dùng Computer Use

Trong **chat mới** của Antigravity, nhập:

> /computer-use Mở Notepad, nhập “Xin chào Việt Nam”, rồi cho tôi xem kết quả. Chưa lưu tệp.

Skill dùng mô hình của Antigravity để quan sát và thao tác ứng dụng qua bộ điều khiển local. Chọn mô hình hỗ trợ ảnh và công cụ. Sidecar `antigravity-computer-use` lo vòng đời tiến trình; nếu App chưa nhận cấu hình mới, tải lại sidecar hoặc mở lại App sau khi đã lưu công việc.

Quyền hiện có được giữ lại. Cài mới theo luồng sidecar của upstream dùng `host-managed`: tuân theo xác nhận/quyền của Antigravity, không tự đổi Turbo hoặc cấp quyền rộng. Bộ cài không đưa token hay tài khoản máy phát triển sang máy khác.

Nhấn **Esc** hoặc **Ctrl + Alt + F12** để dừng theo cơ chế của Computer Use. Đăng nhập, UAC và hộp thoại bảo mật cần người dùng xử lý. Không đồng thời ra lệnh cho `/computer-use` và `windows-control` thao tác chuột/phím trong cùng công việc. Không bảo đảm điều khiển tốt mọi app.

## Thư mục và nhật ký

- Bộ Việt hóa, preview, Python và CAD: `%LOCALAPPDATA%\AntigravityVietnamese`.
- Kết quả tích hợp: `integrations-status.json` trong thư mục trên; có đường dẫn Computer Use và trạng thái giữ nguyên CAD.
- MCP global: `%USERPROFILE%\.gemini\config\mcp_config.json`.
- Skill: `%USERPROFILE%\.gemini\config\skills\computer-use`.
- Sidecar: `%USERPROFILE%\.gemini\config\sidecars\antigravity-computer-use`.
- Computer Use dùng thư mục riêng được upstream chọn hoặc đường dẫn triển khai cũ. Xem `deployment.json` trong thư mục skill; không giả định mọi máy đều có ổ D:.

Các đường dẫn backup cụ thể của Computer Use nằm trong kết quả cài đặt. Giữ chúng nếu cần rollback; không xóa cả `.gemini` hoặc cả cây cấu hình.

## Khi gặp lỗi

- **Vẫn báo `anchors`:** đóng/mở lại tab XLSX sau khi cài bản 2.2.0; nếu vẫn lỗi, ghi tên phiên bản và gửi tệp mẫu không có dữ liệu riêng tư qua Issue.
- **Preview trống:** thử tệp nhỏ không mã hóa, kiểm tra phần mở rộng và nút ↻. Bản App mới có thể đổi cấu trúc khung; xem giới hạn tương thích trước khi ép vá.
- **Thiếu `/computer-use`:** mở chat mới; kiểm tra `SKILL.md` và `deployment.json` tại đường dẫn trên. Chạy lại bộ cài nếu thiếu runtime; chỉ sao chép skill không đủ.
- **CAD báo không kết nối:** kiểm tra engine. `com` cần AutoCAD thật và COM đã đăng ký. Với xử lý DXF không mở AutoCAD, chọn `ezdxf`.
- **Có sẵn MCP autocad nhưng đường dẫn cũ hỏng:** sao lưu cấu hình, cập nhật riêng mục đó theo runtime đi kèm. Bộ cài cố ý không ghi đè thiết lập đã có.
- **Computer Use từ chối vì đang chạy/Stop:** kết thúc công việc theo [hướng dẫn upstream](https://github.com/shayann07/antigravity-computer-use/blob/main/docs/INSTALLATION.md). Không cưỡng bức dừng hoặc xóa trạng thái để vượt cơ chế bảo vệ.

## Tắt, gỡ và khôi phục

Khôi phục ASAR gốc bằng shortcut **Khôi phục giao diện gốc** sẽ tắt Việt hóa và preview trực tiếp. Xem [README](../README.md#khôi-phục-giao-diện-gốc).

AutoCAD MCP có thể tắt/xóa riêng mục `autocad` trong phần quản lý MCP. Computer Use gỡ theo hướng dẫn upstream: kết thúc phiên, tắt/gỡ sidecar của dự án và skill tương ứng, giữ backup nếu cần. Plugin Windows & Office tắt/gỡ riêng trong **Tùy chỉnh → Đã cài**. Không xóa runtime CAD khi cấu hình vẫn đang trỏ vào đó.

## Kiểm tra bản phát hành

EXE cuối đã giải nén/xác minh trong đường dẫn tiếng Việt có khoảng trắng; CAD tạo/lưu/render và Computer Use cài/reuse trong hồ sơ thử riêng từ payload giải nén. Đã cài nâng cấp trên máy phát triển và quan sát trực tiếp cả DOCX, PPTX, XLSX (gồm sheet chart-only) và PDF trong khung phải App 2.34.0. Không đưa tài liệu, ảnh sidebar hoặc cấu hình tài khoản máy phát triển vào release. Live AutoCAD COM chưa có môi trường kiểm tra.

## Nguồn và giấy phép

Hai dự án tích hợp đều công bố giấy phép MIT; bundle giữ thông báo và giấy phép đi kèm. Phụ thuộc Python/Node có giấy phép riêng, được giữ trong payload. Phiên bản và SHA-256 upstream cố định ở [integrations-lock.json](../scripts/integrations-lock.json); danh sách Python ở [autocad-requirements.txt](../scripts/autocad-requirements.txt).
