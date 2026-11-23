## 2.2.0 — Office/PDF, AutoCAD MCP và Computer Use trong một bộ cài

### Cài mới / nâng cấp

1. Lưu công việc, kết thúc phiên điều khiển máy và thoát hẳn Antigravity.
2. Tải **Antigravity-Tieng-Viet-Setup-x64-v2.2.0.exe** từ release này.
3. Chạy EXE, chọn thư mục chứa Antigravity.exe và cài đặt.
4. Mở shortcut Antigravity tiếng Việt. Mở chat mới để dùng `/computer-use` hoặc MCP `autocad`; bấm ↻ ở tab tài liệu cũ để tải lại preview.

Đã kèm Python, Node, phụ thuộc AutoCAD và bundle Computer Use: không cần cài thêm bằng pip/npx hoặc chạy lệnh tải script một dòng. Máy cần Windows 10/11 x64 và Antigravity App desktop thuộc họ được hỗ trợ; đã kiểm tra App 2.34.0, không dành cho IDE dựa trên VS Code.

### Thay đổi

- Sửa XLSX có biểu đồ gây `Cannot read properties of undefined (reading 'anchors')`; vẫn đọc bảng, sheet, ô gộp và kết quả công thức đã lưu. Không sửa tệp gốc.
- Ngăn nội dung DOCX/PPTX/XLSX và lượt render PDF cũ ghi đè tệp mới khi chuyển nhanh.
- PPTX theo thứ tự slide trong presentation, không chỉ theo tên slide1/slide2.
- **AutoCAD MCP Pro 1.8.0**, từ U-C4N/Autocad-MCP. Runtime riêng; cấu hình mới chọn COM nếu AutoCAD đã đăng ký, ezdxf nếu máy chưa có AutoCAD. Giữ nguyên mục autocad và server khác đã có.
- **Antigravity Computer Use 1.0.6**, từ shayann07/antigravity-computer-use. Tích hợp skill `/computer-use` + sidecar theo luồng upstream; xác minh hash và inventory. Giữ chế độ quyền, thiết lập mô hình và các tích hợp không liên quan.

### Kiểm tra và giới hạn

Đã kiểm tra trực tiếp DOCX/PPTX/XLSX/PDF trong khung phải của Antigravity App 2.34.0 sau khi cài EXE cuối; PDF giữ viewer của host khi host đã hỗ trợ. Đã kiểm tra UI bốn định dạng, XLSX chart-only, chuyển sheet/ô gộp/kết quả công thức, thứ tự PPTX, PDF chuyển trang/zoom, phản hồi tệp đến trễ và khung gốc dưới sandbox/CSP. Đã kiểm tra runtime CAD tạo/lưu/render và cài mới/reuse Computer Use trong hồ sơ riêng. Live AutoCAD COM chưa được kiểm thử trên máy phát triển chưa cài AutoCAD.

Preview là bản xem nhẹ, không chỉnh sửa: tối đa 10 MiB. XLSX chưa hiện biểu đồ/ảnh; PPTX chưa tái tạo đầy đủ theme/SmartArt/animation; DOCX có thể khác bản in; PDF mã hóa chưa hỗ trợ nhập mật khẩu. Bộ cài không kèm ứng dụng/giấy phép AutoCAD hoặc Office. Cửa sổ bảo mật/UAC và đăng nhập vẫn do người dùng xử lý.

**Dùng EXE đầy đủ** để nhận cả runtime và hook preview khung phải. ZIP plugin rời chỉ có Windows & Office, không chứa AutoCAD MCP hoặc Computer Use.

[Hướng dẫn đầy đủ](https://github.com/hongnam207/antigravity-tieng-viet/blob/main/docs/INTEGRATED-SETUP.md) · [Mã nguồn](https://github.com/hongnam207/antigravity-tieng-viet) · [AutoCAD upstream](https://github.com/U-C4N/Autocad-MCP) · [Computer Use upstream](https://github.com/shayann07/antigravity-computer-use)

Bộ cài chưa ký số. Dùng SHA256SUMS.txt cùng release để đối chiếu tệp.
