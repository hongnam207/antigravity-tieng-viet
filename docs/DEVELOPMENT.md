# Phát triển và build

## Build bộ cài

Cần Node.js 22+ và npm để bundle plugin, Windows x64, PowerShell 5.1+ và C# compiler .NET Framework 4.x tại `%WINDIR%\Microsoft.NET\Framework64\v4.0.30319\csc.exe`.

```powershell
git clone https://github.com/hongnam207/antigravity-tieng-viet.git
cd antigravity-tieng-viet
npm ci
.\scripts\build.ps1
```

Script tải `payload.zip` của v2.0.3, kiểm tra SHA-256, giải nén runtime/mô hình, ghi đè mã tác giả từ `src/payload`, rồi đóng gói bộ cài vào `dist/`. Có thể tải trước và truyền `-PayloadZip C:\path\payload.zip`.

Đây là build mã tác giả với **phụ thuộc nhị phân đã đóng gói**, không phải tái tạo mọi thư viện từ nguồn. Không cam kết binary giống từng byte do metadata ZIP/compiler. Mã tác giả trong payload luôn được ghi đè bằng checkout hiện tại. Chưa cung cấp quy trình tự động tái tạo toàn bộ runtime/mô hình từ đầu.

## Kiểm tra

Sau khi build:

```powershell
& .\build\payload\runtime\python.exe -I -X utf8 .\tests\test-worker.py
& .\build\payload\node.exe .\tests\test-lifecycle.cjs
npm install
npm test
```

Test DOM dùng Playwright và Chrome ở vị trí tiêu chuẩn Windows; đặt `CHROME_PATH` nếu khác. Worker test chạy suy luận thật, chặn networking qua audit hook và kiểm tra cache/lazy loading. Lifecycle test kiểm tra lô đồng thời, thoát lúc idle và khởi động lại. DOM test dùng fixture giả, không chứa mã Antigravity.

Kiểm tra giải nén và mô hình bằng bộ cài:

```powershell
$p = Start-Process .\dist\Antigravity-Tieng-Viet-Setup-x64-v2.1.2.exe -ArgumentList '--verify', '"C:\Temp\agvi-verify"' -Wait -PassThru
$p.ExitCode
```

Mã 0 là thành công. Thử vá thật chỉ trên bản ứng dụng thử nghiệm có sao lưu. Không commit ASAR hoặc dữ liệu tài khoản.

## Kiến trúc

1. Launcher kiểm tra cấu trúc ASAR, sao lưu bản gốc có hash, thêm hook main/preload.
2. Renderer nhận diện nhãn, tra từ điển/cache, gom câu đủ điều kiện.
3. Main kiểm tra origin loopback, frame, preferences và giới hạn IPC.
4. Python nhận JSON-lines qua pipe; chỉ import/nạp CTranslate2 khi có cache miss đủ điều kiện.
5. Main kết thúc worker khi hết lô đang chờ. Yêu cầu mới tạo tiến trình mới; cache đĩa giữ kết quả.

Nếu worker lỗi, giao diện giữ chữ gốc. Không dùng Google Translate hoặc mở HTTP server. Phiên bản phụ thuộc và model revision nằm trong `src/payload/BUILD.txt` và `THIRD_PARTY_NOTICES.md`.

## Windows/Office plugin

`npm run build:plugin` tạo `build/plugin` bằng esbuild và C# compiler. `npm run test:plugin` kiểm tra MCP qua stdio, metadata viewer, cài plugin giữ cấu hình khác và UI Office qua mock host trong Chrome. `src/windows/WindowsBridge.cs` chạy theo từng yêu cầu, không thường trú. `src/payload/install-plugin.cjs` thêm plugin vào thư mục user của Antigravity và sao lưu import_manifest trước khi cập nhật. Không đổi MCP khác hoặc tự bật quyền không giới hạn.

Xem [WINDOWS-OFFICE.md](WINDOWS-OFFICE.md) về giới hạn định dạng và quyền riêng tư. `build/plugin/THIRD-PARTY-LICENSES.txt` gom giấy phép phụ thuộc khi build.

PDF dùng import động để chỉ khởi tạo PDF.js khi mở PDF; parser được bundle local trong trang và dùng fallback cùng luồng để không phụ thuộc worker URL trong sandbox. Kiểm tra điều hướng trang, zoom, đổi file và PDF hỏng trong `tests/test-office-ui.mjs`.

## Preview trong khung tệp gốc (2.1.2)

`npm run test:inline` kiểm tra hook renderer và IPC với native bridge thật: chỉ đọc tab local hiện tại, chặn origin/frame/loại tệp không hợp lệ, đường dẫn tiếng Việt/encode hai lần, hiển thị DOCX/XLSX/PDF trong iframe sandbox/CSP, đổi tab và giữ DOM ứng dụng. Hook tương thích chỉ kích hoạt tại thông báo unsupported-file của App 2.34.0; không thay viewer đã được host hỗ trợ.
