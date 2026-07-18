# Gemini Gem Auto Flow Extension — Feature Use Cases

## 1. Quy ước

Mỗi use case gồm:

- **ID**
- **Tên**
- **Actor**
- **Mục tiêu**
- **Tiền điều kiện**
- **Luồng chính**
- **Luồng thay thế**
- **Ngoại lệ**
- **Hậu điều kiện**
- **Tiêu chí chấp nhận**

---

# Nhóm A — Quản lý Gem Profile

## UC-PROFILE-001 — Tạo Gem Profile

**Actor:** Người dùng

**Mục tiêu:** Tạo một cấu hình Gem mới để tái sử dụng trong auto-flow.

**Tiền điều kiện:**

- Extension đã được cài đặt.
- Người dùng mở Dashboard.

**Luồng chính:**

1. Người dùng chọn `New Profile`.
2. Hệ thống hiển thị form tạo profile.
3. Người dùng nhập tên profile.
4. Người dùng nhập Base URL của Gem.
5. Người dùng có thể nhập tên Gem dự kiến để xác minh.
6. Người dùng thêm danh sách stage.
7. Người dùng chọn stage dùng làm output.
8. Người dùng cấu hình timeout, retry và export.
9. Người dùng chọn `Save`.
10. Hệ thống validate dữ liệu.
11. Hệ thống lưu profile.
12. Profile xuất hiện trong danh sách.

**Ngoại lệ:**

- Base URL không thuộc `gemini.google.com`.
- Profile ID bị trùng.
- Không có stage.
- Output stage không tồn tại.
- Không có stage loại `script`.

**Hậu điều kiện:**

- Gem Profile được lưu trong storage.
- Profile có thể được chọn khi tạo Run.

**Tiêu chí chấp nhận:**

- [ ] Profile được lưu sau khi dữ liệu hợp lệ.
- [ ] Dữ liệu sai được hiển thị rõ tại field tương ứng.
- [ ] Reload Dashboard không làm mất profile.
- [ ] Profile mới có thể được chọn trong Run Configuration.

---

## UC-PROFILE-002 — Sửa Gem Profile

**Actor:** Người dùng

**Mục tiêu:** Thay đổi URL, stage hoặc cấu hình output của profile.

**Luồng chính:**

1. Người dùng chọn một profile.
2. Hệ thống tải dữ liệu vào form.
3. Người dùng sửa thông tin.
4. Người dùng chọn `Save`.
5. Hệ thống validate.
6. Hệ thống cập nhật profile.

**Luồng thay thế:**

- Người dùng chọn `Cancel`, hệ thống không lưu thay đổi.

**Ngoại lệ:**

- Profile đang được một Run sử dụng.
- Dữ liệu stage không hợp lệ.

**Tiêu chí chấp nhận:**

- [ ] Thay đổi được lưu đúng.
- [ ] Không làm thay đổi lịch sử kết quả cũ.
- [ ] Run đang chạy sử dụng snapshot profile tại thời điểm bắt đầu.

---

## UC-PROFILE-003 — Sao chép Gem Profile

**Actor:** Người dùng

**Mục tiêu:** Tạo profile mới từ một profile có sẵn.

**Luồng chính:**

1. Người dùng chọn `Duplicate`.
2. Hệ thống sao chép toàn bộ cấu hình.
3. Hệ thống sinh ID mới.
4. Hệ thống thêm hậu tố `Copy` vào tên.
5. Người dùng chỉnh sửa và lưu.

**Tiêu chí chấp nhận:**

- [ ] Profile gốc không bị thay đổi.
- [ ] Profile mới có ID riêng.
- [ ] Toàn bộ stage được sao chép đúng thứ tự.

---

## UC-PROFILE-004 — Xóa Gem Profile

**Actor:** Người dùng

**Mục tiêu:** Xóa profile không còn sử dụng.

**Luồng chính:**

1. Người dùng chọn `Delete`.
2. Hệ thống hiển thị xác nhận.
3. Người dùng xác nhận.
4. Hệ thống xóa profile.

**Ngoại lệ:**

- Profile đang được Run hiện tại sử dụng.

**Tiêu chí chấp nhận:**

- [ ] Không thể xóa profile đang chạy.
- [ ] Người dùng phải xác nhận trước khi xóa.
- [ ] Xóa profile không xóa lịch sử Run.

---

## UC-PROFILE-005 — Bật hoặc tắt Gem Profile

**Actor:** Người dùng

**Mục tiêu:** Ẩn profile khỏi danh sách có thể chạy mà không cần xóa.

**Tiêu chí chấp nhận:**

- [ ] Profile bị tắt không xuất hiện trong lựa chọn chạy.
- [ ] Profile vẫn có thể chỉnh sửa.
- [ ] Profile có thể bật lại.

---

## UC-PROFILE-006 — Sắp xếp Stage

**Actor:** Người dùng

**Mục tiêu:** Thay đổi thứ tự thực thi stage.

**Luồng chính:**

1. Người dùng kéo thả hoặc dùng nút lên/xuống.
2. Hệ thống cập nhật thứ tự hiển thị.
3. Người dùng lưu profile.
4. Hệ thống cập nhật trường `order`.

**Tiêu chí chấp nhận:**

- [ ] Thứ tự hiển thị bằng thứ tự thực thi.
- [ ] Reload không làm mất thứ tự.
- [ ] Stage output vẫn được tham chiếu bằng ID.

---

## UC-PROFILE-007 — Thêm Stage

**Actor:** Người dùng

**Mục tiêu:** Thêm một bước xử lý vào Gem Profile.

**Loại stage MVP:**

- `script`: sử dụng script hiện tại.
- `fixed`: gửi một giá trị cố định.

**Loại stage mở rộng:**

- `template`: render prompt từ biến.
- `previous_response`: sử dụng response stage trước.

**Tiêu chí chấp nhận:**

- [ ] Có thể thêm nhiều stage.
- [ ] Stage ID không được trùng.
- [ ] Stage fixed bắt buộc có input value.
- [ ] Stage script không yêu cầu input value.

---

## UC-PROFILE-008 — Xóa Stage

**Actor:** Người dùng

**Mục tiêu:** Loại bỏ stage khỏi profile.

**Ngoại lệ:**

- Stage đang được chọn làm output.
- Xóa stage script duy nhất.

**Tiêu chí chấp nhận:**

- [ ] Hệ thống cảnh báo nếu stage là output.
- [ ] Profile phải còn ít nhất một stage.
- [ ] Profile phải còn stage script theo quy tắc MVP.

---

## UC-PROFILE-009 — Chọn Stage Output

**Actor:** Người dùng

**Mục tiêu:** Chọn response stage nào được dùng làm kết quả cuối.

**Tiêu chí chấp nhận:**

- [ ] Chỉ chọn được stage đang tồn tại.
- [ ] Output được lưu theo stage ID.
- [ ] Thay đổi thứ tự stage không làm sai output.

---

## UC-PROFILE-010 — Test Gem Profile

**Actor:** Người dùng

**Mục tiêu:** Kiểm tra URL Gem và khả năng nhận diện giao diện trước khi chạy batch.

**Luồng chính:**

1. Người dùng chọn `Test Profile`.
2. Extension mở tab Gem.
3. Content script kiểm tra trang đã sẵn sàng.
4. Hệ thống xác minh tên Gem nếu được cấu hình.
5. Hệ thống kiểm tra editor và nút Send.
6. Hệ thống hiển thị kết quả.
7. Extension đóng tab test nếu được cấu hình.

**Tiêu chí chấp nhận:**

- [ ] Không gửi prompt trong quá trình test.
- [ ] Hiển thị rõ selector hoặc thành phần không tìm thấy.
- [ ] Phân biệt lỗi đăng nhập và lỗi sai Gem.

---

# Nhóm B — Quản lý Script

## UC-SCRIPT-001 — Thêm Script

**Actor:** Người dùng

**Mục tiêu:** Thêm nội dung cần được xử lý.

**Luồng chính:**

1. Người dùng chọn `Add Script`.
2. Hệ thống tạo một ô script mới.
3. Người dùng nhập ID, title và content.
4. Hệ thống tự lưu bản nháp.

**Tiêu chí chấp nhận:**

- [ ] Script content hỗ trợ văn bản dài.
- [ ] ID không được trùng trong cùng batch.
- [ ] Hiển thị số ký tự.
- [ ] Reload không làm mất bản nháp.

---

## UC-SCRIPT-002 — Sửa Script

**Actor:** Người dùng

**Mục tiêu:** Chỉnh sửa nội dung script trước khi chạy.

**Tiêu chí chấp nhận:**

- [ ] Có autosave hoặc nút Save rõ ràng.
- [ ] Không cho sửa script đang được Job hiện tại xử lý.
- [ ] Run sử dụng snapshot script tại thời điểm bắt đầu.

---

## UC-SCRIPT-003 — Xóa Script

**Actor:** Người dùng

**Mục tiêu:** Xóa script khỏi batch.

**Tiêu chí chấp nhận:**

- [ ] Có xác nhận khi script chứa nội dung.
- [ ] Không thể xóa script đang chạy.
- [ ] Xóa script không ảnh hưởng kết quả Run trước.

---

## UC-SCRIPT-004 — Bật hoặc tắt Script

**Actor:** Người dùng

**Mục tiêu:** Loại một script khỏi lần chạy mà không xóa nội dung.

**Tiêu chí chấp nhận:**

- [ ] Script bị tắt không được tạo Job.
- [ ] Có thể bật lại trước khi Run bắt đầu.

---

## UC-SCRIPT-005 — Sắp xếp Script

**Actor:** Người dùng

**Mục tiêu:** Xác định thứ tự xử lý.

**Tiêu chí chấp nhận:**

- [ ] Queue chạy theo đúng thứ tự hiển thị.
- [ ] Thứ tự được lưu.
- [ ] Không đổi thứ tự khi Run đang hoạt động.

---

## UC-SCRIPT-006 — Sao chép Script

**Actor:** Người dùng

**Mục tiêu:** Tạo script mới từ nội dung hiện tại.

**Tiêu chí chấp nhận:**

- [ ] Script mới có ID khác.
- [ ] Nội dung được sao chép đầy đủ.
- [ ] Script gốc không bị thay đổi.

---

# Nhóm C — Chuẩn bị Run

## UC-RUN-001 — Chọn Gem Profile

**Actor:** Người dùng

**Mục tiêu:** Chọn quy trình stage dùng để xử lý batch script.

**Luồng chính:**

1. Người dùng mở Run Configuration.
2. Người dùng chọn Gem Profile.
3. Hệ thống hiển thị preview:
   - Tên Gem.
   - Base URL.
   - Danh sách stage.
   - Output stage.
   - Timeout và retry.
4. Người dùng xác nhận.

**Tiêu chí chấp nhận:**

- [ ] Chỉ hiển thị profile đang bật.
- [ ] Preview đúng thứ tự stage.
- [ ] Profile không bị chỉnh sửa ngầm bởi Run.

---

## UC-RUN-002 — Chọn Script cần chạy

**Actor:** Người dùng

**Mục tiêu:** Chọn một phần hoặc toàn bộ script trong batch.

**Tiêu chí chấp nhận:**

- [ ] Có Select All và Clear All.
- [ ] Script disabled không được chọn.
- [ ] Phải có ít nhất một script được chọn.

---

## UC-RUN-003 — Validate trước khi chạy

**Actor:** Hệ thống

**Mục tiêu:** Ngăn Run bắt đầu với dữ liệu không hợp lệ.

**Kiểm tra:**

- Profile tồn tại và đang bật.
- Profile có Base URL hợp lệ.
- Profile có stage.
- Output stage tồn tại.
- Có script được chọn.
- Script content không rỗng.
- Không có Run khác đang chạy.

**Tiêu chí chấp nhận:**

- [ ] Mỗi lỗi được mô tả rõ.
- [ ] Run không được tạo khi validation thất bại.
- [ ] Người dùng có thể quay lại vị trí cần sửa.

---

## UC-RUN-004 — Bắt đầu Auto Flow

**Actor:** Người dùng

**Mục tiêu:** Bắt đầu chạy các script theo Gem Profile.

**Luồng chính:**

1. Người dùng chọn `Start Auto Flow`.
2. Hệ thống validate.
3. Hệ thống tạo snapshot của profile và script.
4. Hệ thống tạo Run.
5. Hệ thống tạo danh sách Job.
6. Run chuyển sang `RUNNING`.
7. Hệ thống bắt đầu Job đầu tiên.

**Tiêu chí chấp nhận:**

- [ ] Mỗi script được tạo thành một Job.
- [ ] Chỉ một Job chạy tại một thời điểm trong MVP.
- [ ] Trạng thái được lưu trước khi mở tab.
- [ ] Run có thể phục hồi nếu service worker restart.

---

# Nhóm D — Thực thi Job

## UC-JOB-001 — Mở Gem trong Tab mới

**Actor:** Hệ thống

**Mục tiêu:** Tạo cuộc trò chuyện độc lập cho mỗi script.

**Luồng chính:**

1. Job chuyển sang `OPENING_TAB`.
2. Hệ thống mở `profile.baseUrl`.
3. Hệ thống lưu `tabId`.
4. Hệ thống chờ tab load.
5. Content script báo sẵn sàng.

**Ngoại lệ:**

- Tab bị người dùng đóng.
- URL không hợp lệ.
- Content script không được inject.

**Tiêu chí chấp nhận:**

- [ ] Mỗi Job dùng tab mới.
- [ ] Tab ID được lưu.
- [ ] Không dùng tab của Job trước.
- [ ] Không mở nhiều tab Job song song trong MVP.

---

## UC-JOB-002 — Xác minh Gem

**Actor:** Hệ thống

**Mục tiêu:** Ngăn gửi script vào sai Gem.

**Luồng chính:**

1. Content script đọc tên Gem.
2. So sánh với `expectedGemName`.
3. Nếu khớp, tiếp tục.
4. Nếu không khớp, áp dụng error policy.

**Tiêu chí chấp nhận:**

- [ ] Có thể bỏ qua xác minh nếu profile không cấu hình tên.
- [ ] Sai Gem không được gửi prompt.
- [ ] Lỗi được ghi log.

---

## UC-JOB-003 — Chạy Stage Script

**Actor:** Hệ thống

**Mục tiêu:** Gửi script hiện tại vào Gem.

**Luồng chính:**

1. Resolve stage input từ script content.
2. Kiểm tra editor sẵn sàng.
3. Nhập toàn bộ nội dung.
4. Kiểm tra nội dung đã được chèn.
5. Nhấn Send.
6. Chờ response bắt đầu.
7. Chờ response hoàn tất.
8. Lưu response.
9. Stage chuyển sang `COMPLETED`.

**Tiêu chí chấp nhận:**

- [ ] Không gửi khi content rỗng.
- [ ] Không nhấn Send trước khi nhập đủ nội dung.
- [ ] Response được gắn đúng stage ID.
- [ ] Không gửi stage tiếp theo khi response chưa hoàn tất.

---

## UC-JOB-004 — Chạy Stage Fixed Input

**Actor:** Hệ thống

**Mục tiêu:** Gửi input cố định như `2`, `3` hoặc một prompt tùy chỉnh.

**Tiêu chí chấp nhận:**

- [ ] Gửi đúng `inputValue`.
- [ ] Chạy trong cùng cuộc trò chuyện của script.
- [ ] Chờ response hoàn tất trước stage tiếp theo.
- [ ] Lưu input và response.

---

## UC-JOB-005 — Phát hiện Response hoàn tất

**Actor:** Hệ thống

**Mục tiêu:** Xác định thời điểm an toàn để chạy stage kế tiếp.

**Điều kiện:**

- Response đã xuất hiện.
- Nội dung không thay đổi trong `stableSeconds`.
- Không còn nút Stop generating.
- Editor sẵn sàng.
- Không có lỗi Gemini.

**Tiêu chí chấp nhận:**

- [ ] Không dựa duy nhất vào sleep cố định.
- [ ] Có timeout fallback.
- [ ] Không đánh dấu hoàn tất với response rỗng.
- [ ] MutationObserver được giải phóng sau stage.

---

## UC-JOB-006 — Lưu Stage Result

**Actor:** Hệ thống

**Mục tiêu:** Lưu kết quả ngay sau mỗi stage.

**Tiêu chí chấp nhận:**

- [ ] Lưu input.
- [ ] Lưu response.
- [ ] Lưu thời gian.
- [ ] Lưu status.
- [ ] Service worker restart không làm mất stage đã hoàn thành.

---

## UC-JOB-007 — Hoàn tất Job

**Actor:** Hệ thống

**Mục tiêu:** Kết thúc xử lý một script.

**Luồng chính:**

1. Tất cả stage hoàn thành.
2. Hệ thống lấy response theo `sourceStageId`.
3. Hệ thống lưu `finalOutput`.
4. Job chuyển sang `COMPLETED`.
5. Hệ thống đóng tab.
6. Queue chuyển Job tiếp theo.

**Tiêu chí chấp nhận:**

- [ ] Output đúng stage được cấu hình.
- [ ] Không đóng tab trước khi lưu kết quả.
- [ ] Job tiếp theo chỉ bắt đầu sau khi Job hiện tại kết thúc.

---

# Nhóm E — Điều khiển Run

## UC-CONTROL-001 — Pause Run

**Actor:** Người dùng

**Mục tiêu:** Tạm dừng queue an toàn.

**Quy tắc:**

- Nếu đang chờ response, hệ thống chờ stage hiện tại hoàn tất rồi pause.
- Không bắt đầu stage mới.
- Không bắt đầu Job mới.

**Tiêu chí chấp nhận:**

- [ ] Run chuyển sang `PAUSED`.
- [ ] Không mất trạng thái hiện tại.
- [ ] Có thể Resume.

---

## UC-CONTROL-002 — Resume Run

**Actor:** Người dùng

**Mục tiêu:** Tiếp tục Run bị pause.

**Tiêu chí chấp nhận:**

- [ ] Tiếp tục từ stage hoặc Job phù hợp.
- [ ] Không gửi lại stage đã hoàn thành.
- [ ] Kiểm tra tab hiện tại còn tồn tại.

---

## UC-CONTROL-003 — Stop Run

**Actor:** Người dùng

**Mục tiêu:** Dừng toàn bộ quy trình.

**Luồng chính:**

1. Người dùng chọn Stop.
2. Hệ thống yêu cầu xác nhận.
3. Run chuyển sang `CANCELLED`.
4. Hệ thống không tạo Job mới.
5. Hệ thống đóng tab automation đang mở.
6. Kết quả đã lưu được giữ lại.

**Tiêu chí chấp nhận:**

- [ ] Không xóa kết quả đã hoàn thành.
- [ ] Không tự Resume sau khi reload.
- [ ] Có thể tạo Run mới sau đó.

---

## UC-CONTROL-004 — Skip Script

**Actor:** Người dùng

**Mục tiêu:** Bỏ qua Job đang lỗi hoặc không cần xử lý.

**Tiêu chí chấp nhận:**

- [ ] Job chuyển sang `SKIPPED`.
- [ ] Lý do được lưu.
- [ ] Queue chuyển Job tiếp theo.
- [ ] Không xuất file final cho Job skipped mặc định.

---

## UC-CONTROL-005 — Retry Stage

**Actor:** Người dùng hoặc hệ thống

**Mục tiêu:** Chạy lại stage thất bại.

**Điều kiện:**

- Stage có lỗi.
- Retry count chưa vượt giới hạn.
- Không có response thành công đã được xác nhận.

**Tiêu chí chấp nhận:**

- [ ] Retry count tăng.
- [ ] Không retry vô hạn.
- [ ] Lưu log cho từng lần retry.
- [ ] Có cảnh báo nguy cơ gửi trùng.

---

## UC-CONTROL-006 — Retry Job

**Actor:** Người dùng

**Mục tiêu:** Chạy lại toàn bộ script trong tab mới.

**Tiêu chí chấp nhận:**

- [ ] Tab cũ được đóng.
- [ ] Tạo conversation mới.
- [ ] Stage results cũ được giữ trong attempt history.
- [ ] Kết quả attempt mới được phân biệt.

---

# Nhóm F — Kết quả và xuất file

## UC-RESULT-001 — Xem kết quả theo Script

**Actor:** Người dùng

**Mục tiêu:** Xem response của từng stage.

**Tiêu chí chấp nhận:**

- [ ] Hiển thị final output.
- [ ] Có thể mở rộng để xem stage response.
- [ ] Hiển thị trạng thái Job.
- [ ] Có nút Copy.

---

## UC-RESULT-002 — Xuất TXT riêng từng Script

**Actor:** Người dùng hoặc hệ thống

**Mục tiêu:** Tạo một file TXT cho mỗi Job thành công.

**Tiêu chí chấp nhận:**

- [ ] Tên file theo template.
- [ ] Nội dung mặc định chỉ gồm final output.
- [ ] Ký tự không hợp lệ trong tên file được thay thế.
- [ ] Không tạo file rỗng.

---

## UC-RESULT-003 — Xuất TXT tổng hợp

**Actor:** Người dùng hoặc hệ thống

**Mục tiêu:** Gộp kết quả của Run thành một file.

**Tiêu chí chấp nhận:**

- [ ] Kết quả theo đúng thứ tự script.
- [ ] Mỗi script có header phân cách.
- [ ] Script failed hoặc skipped được ghi chú nếu bật metadata.

---

## UC-RESULT-004 — Tự động xuất khi Run hoàn tất

**Actor:** Hệ thống

**Mục tiêu:** Xuất kết quả theo cấu hình profile.

**Tiêu chí chấp nhận:**

- [ ] Chỉ chạy sau khi Run hoàn tất.
- [ ] Hỗ trợ `per_script`, `combined`, `both`.
- [ ] Lỗi download không làm mất kết quả trong storage.

---

# Nhóm G — Xử lý lỗi và phục hồi

## UC-ERROR-001 — Phát hiện yêu cầu đăng nhập

**Actor:** Hệ thống

**Mục tiêu:** Dừng an toàn khi Gemini không có session đăng nhập.

**Tiêu chí chấp nhận:**

- [ ] Không gửi prompt.
- [ ] Run chuyển sang Pause hoặc Failed theo policy.
- [ ] Hiển thị hướng dẫn đăng nhập.

---

## UC-ERROR-002 — Phát hiện Usage Limit

**Actor:** Hệ thống

**Mục tiêu:** Không tiếp tục gửi request khi tài khoản đạt giới hạn.

**Tiêu chí chấp nhận:**

- [ ] Run tự pause.
- [ ] Không tự retry liên tục.
- [ ] Giữ queue và kết quả.
- [ ] Cho phép Resume thủ công.

---

## UC-ERROR-003 — Xử lý Response Timeout

**Actor:** Hệ thống

**Mục tiêu:** Xử lý trường hợp Gemini không phản hồi hoàn tất.

**Tiêu chí chấp nhận:**

- [ ] Stage chuyển `TIMEOUT`.
- [ ] Áp dụng error policy.
- [ ] Lưu response tạm nếu có.
- [ ] Hiển thị elapsed time.

---

## UC-ERROR-004 — Phục hồi Service Worker

**Actor:** Hệ thống

**Mục tiêu:** Tiếp tục quản lý Run khi service worker bị Chrome tạm dừng.

**Luồng chính:**

1. Service worker khởi động lại.
2. Đọc active Run từ storage.
3. Kiểm tra active tab.
4. Đọc current Job và Stage.
5. Đồng bộ với content script.
6. Tiếp tục hoặc pause nếu trạng thái không chắc chắn.

**Tiêu chí chấp nhận:**

- [ ] Không mất Run.
- [ ] Không tự gửi lại prompt trong trạng thái không xác định.
- [ ] Trạng thái không chắc chắn phải chuyển Pause.

---

## UC-ERROR-005 — Tab bị đóng thủ công

**Actor:** Người dùng/Hệ thống

**Mục tiêu:** Xử lý khi tab automation biến mất.

**Tiêu chí chấp nhận:**

- [ ] Phát hiện qua Tabs API.
- [ ] Áp dụng `retry_job`, `pause` hoặc `skip`.
- [ ] Không mở tab mới vô hạn.

---

# Nhóm H — Tính năng mở rộng

## UC-EXT-001 — Import Gem Profile JSON

**Mục tiêu:** Thêm profile từ file cấu hình.

## UC-EXT-002 — Export Gem Profile JSON

**Mục tiêu:** Sao lưu hoặc chia sẻ profile.

## UC-EXT-003 — Import Script từ TXT

**Mục tiêu:** Tạo script từ file.

## UC-EXT-004 — Đọc Script từ Google Sheet

**Mục tiêu:** Tạo batch theo row.

## UC-EXT-005 — Ghi Result về Google Sheet

**Mục tiêu:** Ghi output vào đúng row.

## UC-EXT-006 — Template Stage

**Mục tiêu:** Hỗ trợ biến:

```text
{{SCRIPT}}
{{SCRIPT_ID}}
{{SCRIPT_TITLE}}
{{PREVIOUS_RESPONSE}}
{{RESPONSE:stage-id}}
{{CURRENT_INDEX}}
```

## UC-EXT-007 — Pipeline nhiều Gem

**Mục tiêu:** Output của Gem Profile A làm input cho Gem Profile B.
