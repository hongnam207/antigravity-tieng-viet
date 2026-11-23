# Antigravity tiếng Việt — Offline

Việt hóa menu, nút bấm và cài đặt của **Antigravity desktop Electron (`app.asar`)** trên Windows x64, bằng từ điển giao diện và mô hình dịch chạy tại máy.

**[Tải bộ cài mới nhất](https://github.com/hongnam207/antigravity-tieng-viet/releases/latest)** · [Xử lý lỗi](docs/TROUBLESHOOTING.md) · [Phát triển](docs/DEVELOPMENT.md)

> Dự án cộng đồng, không liên kết với Google. Đã kiểm tra với Antigravity desktop **2.34.0**. Không dành cho bản IDE dựa trên VS Code; không bảo đảm tương thích mọi phiên bản tương lai.

## Tính năng

- Ưu tiên từ điển tiếng Việt; giữ tên mô hình Gemini, Claude, GPT.
- Dịch câu giao diện mới bằng OPUS-MT Anh–Việt INT8 trên CPU.
- Chỉ nạp mô hình khi thiếu bản dịch; tiến trình dịch tự thoát khi xử lý hết các lô đang chờ.
- Lưu bản dịch để dùng lại; câu có trong cache không cần nạp mô hình.
- Không cần GPU, API key, Python hay Node.js cài riêng.
- Sao lưu bản gốc và hỗ trợ khôi phục có kiểm tra SHA-256.

## Yêu cầu

- Windows 10/11 **x64**, đã cài Antigravity desktop Electron thuộc họ được hỗ trợ.
- Có quyền ghi vào thư mục Antigravity. Nên để trống ít nhất 1 GB cho bộ chạy, mô hình và bản sao lưu.
- Bộ cài khoảng 144 MB (137 MiB), kèm mô hình và phụ thuộc.

## Cài đặt

1. Mở [Releases](https://github.com/hongnam207/antigravity-tieng-viet/releases/latest), tải **`Antigravity-Tieng-Viet-Offline-Setup-x64-v2.0.3.exe`** trong **Assets**. Không cần tải Source code hoặc `payload.zip`.
2. Thoát hẳn Antigravity, kể cả biểu tượng ở khay hệ thống.
3. Chạy bộ cài. Kiểm tra thư mục được nhận; nếu chưa đúng, bấm **Chọn…** và chọn thư mục chứa `Antigravity.exe`.
4. Bấm **Cài đặt**, đợi thông báo hoàn tất.
5. Mở bằng biểu tượng **Antigravity tiếng Việt** trên Desktop hoặc trong Start.

Cài theo từng tài khoản Windows. Nếu ứng dụng ở thư mục được bảo vệ, tài khoản chạy bộ cài cần quyền ghi phù hợp. Bộ cài chưa ký số; nếu Windows chặn, kiểm tra nguồn tải và SHA-256 trước khi quyết định chạy.

## Sử dụng

Luôn mở qua shortcut **Antigravity tiếng Việt**. Nhãn chuẩn được thay ngay; câu mới có thể còn tiếng Anh trong lúc mô hình nạp và dịch. Kết quả được lưu cho lần sau.

Chỉ nhằm dịch chữ giao diện. Bộ lọc cố giữ nguyên hội thoại, mã, giá trị ô nhập, tên tệp, tên dự án và cuộc trò chuyện. Việc nhận diện có thể chưa đầy đủ khi giao diện thay đổi. Nhãn một từ chưa có trong từ điển được giữ nguyên để tránh đoán sai nghĩa. Hộp thoại Windows có thể vẫn theo ngôn ngữ hệ điều hành. Mô hình nhỏ có thể dịch sai thuật ngữ; hãy báo Issue hoặc bổ sung `vi.json`.

### RAM và hoạt động nền

Không có dịch vụ mô hình thường trực. Khi cần dịch câu chưa có, Python nạp mô hình, dịch các lô đang chờ rồi thoát. Cache được đọc mà không nạp trọng số; tiến trình đọc cache cũng thoát khi xong.

Đo trên máy phát triển với 24 câu mới: Working Set tiến trình dịch cao nhất khoảng **155 MiB**, lúc chờ không còn tiến trình mô hình. Đây là số tham khảo, không phải giới hạn. Antigravity dùng RAM riêng; từ điển/cache JavaScript cũng có mức dùng bộ nhớ riêng.

Kiểm tra ở **Task Manager → Details**, bật **Image path name** để phân biệt `python.exe` tại `%LOCALAPPDATA%\AntigravityVietnamese\runtime\python.exe` với Python của ứng dụng khác. Tiến trình dịch có thể thoát rất nhanh.

## Cập nhật

Sau khi Antigravity cập nhật, thoát rồi mở bằng shortcut tiếng Việt. Launcher kiểm tra và áp dụng lại nếu còn tương thích. Nếu báo không hỗ trợ, không ép cài; gửi phiên bản và lỗi qua Issues.

Nâng cấp bộ Việt hóa: thoát Antigravity rồi chạy bộ cài mới. Giữ `state.json` và `backups`. Nếu chuyển từ bộ rời, dùng nút **Chọn bộ Việt hóa cũ** để chỉ tới thư mục có hồ sơ sao lưu.

## Khôi phục giao diện gốc

1. Thoát Antigravity.
2. Chọn **Start → Antigravity tiếng Việt → Khôi phục giao diện gốc**.
3. Mở Antigravity như bình thường.

Khôi phục dùng bản gốc khớp hash, không ghi đè một phiên bản đã đổi không xác định. Muốn xóa hoàn toàn bộ dịch, chỉ xóa `%LOCALAPPDATA%\AntigravityVietnamese` và shortcut sau khi khôi phục thành công. Xóa trước sẽ mất bản sao lưu cần cho khôi phục.

## Dữ liệu và quyền riêng tư

Bộ dịch không gửi văn bản tới dịch vụ dịch và không mở máy chủ/cổng mạng. Antigravity vẫn có hoạt động mạng riêng.

Tệp trong `%LOCALAPPDATA%\AntigravityVietnamese`:

| Tệp/thư mục | Mục đích |
| --- | --- |
| `runtime/`, `model/`, `node.exe` | Bộ chạy và mô hình |
| `vi.json` | Từ điển chuẩn |
| `cache/translations.json` | Câu gốc và bản dịch đã lưu |
| `backups/`, `state.json` | Bản gốc và hồ sơ khôi phục |
| `runtime-status.json` | Trạng thái kỹ thuật gần nhất |

Cache có thể chứa chữ riêng của máy. Không đăng cache, bản sao lưu hoặc thư mục cài lên Issues. Chỉ xóa cache khi ứng dụng đã thoát.

## Mã nguồn

```text
src/Installer.cs          Bộ cài/launcher WinForms
src/payload/patcher.cjs   Kiểm tra, sao lưu, vá và khôi phục ASAR
src/payload/renderer.js   Nhận diện nhãn và cập nhật bản dịch
src/payload/native.js     IPC và vòng đời tiến trình dịch
src/payload/translator.py Mô hình CPU và cache
src/payload/vi.json       Từ điển Anh–Việt
scripts/build.ps1         Tạo bộ cài từ nguồn và payload kiểm tra hash
tests/                    Worker, IPC, DOM và vòng đời tiến trình
```

Xem [DEVELOPMENT.md](docs/DEVELOPMENT.md) để build và kiểm tra. Runtime/trọng số ở Releases, không nằm trong Git. Không kèm bản sao ứng dụng Antigravity.

## Đóng góp và báo lỗi

Xem [CONTRIBUTING.md](CONTRIBUTING.md). Issue cần phiên bản Windows/Antigravity/bộ dịch, thao tác tái hiện và nhãn trước/sau. Che thông tin riêng trong ảnh. Vấn đề bảo mật: [SECURITY.md](SECURITY.md).

## Giấy phép

Mã tác giả: [MIT](LICENSE). Phụ thuộc giữ giấy phép riêng: [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). Mô hình [Helsinki-NLP/opus-mt-en-vi](https://huggingface.co/Helsinki-NLP/opus-mt-en-vi), revision `989c9fb9ec63987901022baf0182dcec3e149be6`, Apache-2.0, chuyển sang CTranslate2 INT8. Nhãn hiệu thuộc các chủ sở hữu tương ứng.
