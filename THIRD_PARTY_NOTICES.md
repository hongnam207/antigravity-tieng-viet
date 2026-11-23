# Thành phần bên thứ ba

Từ 2.2.0, bộ cài đầy đủ phân phối thêm:

- **AutoCAD MCP Pro 1.8.0**, MIT, [U-C4N/Autocad-MCP](https://github.com/U-C4N/Autocad-MCP). Runtime giữ toàn bộ metadata và giấy phép wheel; danh sách đóng băng ở `scripts/autocad-requirements.txt`. Python site-packages riêng có cả pywin32, matplotlib, Pillow và openpyxl.
- **Antigravity Computer Use 1.0.6**, MIT, [shayann07/antigravity-computer-use](https://github.com/shayann07/antigravity-computer-use), giữ nguyên bundle cùng `LICENSE`, `licenses/`, manifest và các thông báo upstream. Dự án này dựa trên ridelink0/claude-computer-use theo thông báo của upstream. Node và các helper native trong bundle có giấy phép riêng đi kèm.
- Nguồn ZIP và helper chính xác, revision helper và SHA-256 nằm ở `scripts/integrations-lock.json` và `integrations/SOURCES.json` trong bộ cài. Không phân phối Autodesk AutoCAD, giấy phép Autodesk hay Microsoft Office.

Plugin Windows & Office 2.1.0 dùng `@modelcontextprotocol/sdk`, `@modelcontextprotocol/ext-apps`, `zod`, `docx-preview`, `exceljs`, `jszip` và phụ thuộc theo `package-lock.json`. Giấy phép đầy đủ được gom trong `plugin/THIRD-PARTY-LICENSES.txt` ở bộ cài. Windows bridge là mã C# của dự án dùng API Windows/.NET; không phân phối CursorTouch/Windows-MCP.

MIT ở gốc chỉ áp dụng cho mã do dự án tạo. Thành phần đi kèm giữ giấy phép riêng:

| Thành phần | Phiên bản/revision | Giấy phép / nguồn |
| --- | --- | --- |
| OPUS-MT en–vi | `989c9fb9ec63987901022baf0182dcec3e149be6` | Apache-2.0; https://huggingface.co/Helsinki-NLP/opus-mt-en-vi |
| CTranslate2 | 4.8.4 | MIT; https://github.com/OpenNMT/CTranslate2 |
| SentencePiece | 0.2.1 | Apache-2.0; https://github.com/google/sentencepiece |
| CPython embedded x64 | 3.12.10 | PSF và thông báo đi kèm; https://www.python.org/ |
| NumPy | 2.5.5 | BSD và giấy phép phụ thuộc; https://numpy.org/ |
| PyYAML | 6.0.4 | MIT; https://pyyaml.org/ |
| Node.js win-x64 | 24.22.3 | MIT và giấy phép phụ thuộc; https://nodejs.org/ |

Trọng số gốc được xác minh SHA-256 từ metadata LFS rồi chuyển INT8 bằng CTranslate2, không huấn luyện thêm. Ghi công Helsinki-NLP, OPUS-MT và các bên đóng góp được nêu trong model card.

Giấy phép đầy đủ nằm trong payload: `MODEL-NOTICE.txt`, `model/README.md`, `licenses/APACHE-2.0.txt`, `NODE-LICENSE.txt`, `runtime/LICENSE.txt` và các thư mục `*.dist-info/licenses`. Các thư viện native giữ thông báo đi kèm bản phân phối. Antigravity phải được người dùng cài riêng; bản phát hành không chứa ứng dụng đó.

PDF Preview 2.1.1 dùng Mozilla PDF.js (`pdfjs-dist` 6.5.438, Apache-2.0), nguồn https://github.com/mozilla/pdf.js. Worker được bundle cùng HTML và xử lý tại máy, không tải từ CDN. Giấy phép có trong plugin/THIRD-PARTY-LICENSES.txt.
