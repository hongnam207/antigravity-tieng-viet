# Thành phần bên thứ ba

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
