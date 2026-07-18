# Gemini Gem Auto Flow Extension — Task Roadmap & Tracking

## 1. Quy ước tracking

- `[ ]` Chưa thực hiện
- `[x]` Đã hoàn thành
- `[~]` Đang thực hiện — Markdown chuẩn không hỗ trợ trạng thái này dưới dạng checkbox; khi tracking thực tế nên giữ `[ ]` và thêm nhãn `IN PROGRESS`.
- `BLOCKED` Đang bị chặn
- `P0` Bắt buộc cho MVP
- `P1` Quan trọng sau MVP
- `P2` Mở rộng

### Definition of Done chung

Một task chỉ được tick `[x]` khi:

- Code đã hoàn thành.
- Có validation và error handling phù hợp.
- Đã test thủ công hoặc tự động.
- Không gây lỗi luồng hiện tại.
- Có log cần thiết.
- Tài liệu liên quan đã cập nhật.
- Không còn TODO quan trọng trong phạm vi task.

---

# Phase 0 — Khởi tạo dự án

## EPIC-00 — Project Bootstrap

- [x] **TASK-0001 — Tạo cấu trúc thư mục extension** `P0`
  - Tạo các thư mục `background`, `content`, `core`, `storage`, `dashboard`, `popup`, `export`.
  - **Done khi:** Chrome có thể Load unpacked mà không báo lỗi.

- [x] **TASK-0002 — Tạo manifest.json Manifest V3** `P0`
  - Khai báo `storage`, `tabs`, `downloads`.
  - Khai báo host permission `https://gemini.google.com/*`.
  - Khai báo service worker và content script.
  - **Phụ thuộc:** TASK-0001.
  - **Done khi:** Extension hiển thị trong `chrome://extensions`.

- [x] **TASK-0003 — Tạo service worker tối thiểu** `P0`
  - Log khi extension được cài đặt.
  - Nhận message ping.
  - **Done khi:** Có thể inspect service worker và không có lỗi.

- [x] **TASK-0004 — Tạo content script tối thiểu** `P0`
  - Inject trên trang Gemini.
  - Trả về URL và document title khi ping.
  - **Done khi:** Console Gemini hiển thị content script loaded.

- [x] **TASK-0005 — Tạo popup tối thiểu** `P0`
  - Nút mở Dashboard.
  - Hiển thị Run status cơ bản.
  - **Done khi:** Popup mở được và điều hướng đúng.

- [x] **TASK-0006 — Tạo Dashboard shell** `P0`
  - Navigation: Profiles, Scripts, Run, Results.
  - **Done khi:** Chuyển tab nội bộ không reload toàn trang.

---

# Phase 1 — Core Models và Storage

## EPIC-01 — Domain Models

- [x] **TASK-0101 — Định nghĩa GemProfile model** `P0`
  - Field: id, name, baseUrl, expectedGemName, enabled, stages, output, errorPolicy.
  - **Done khi:** Có factory/default model và validation type cơ bản.

- [x] **TASK-0102 — Định nghĩa Stage model** `P0`
  - Hỗ trợ `script` và `fixed`.
  - Field timeout, stableSeconds, retryCount.
  - **Done khi:** Có thể serialize/deserialize.

- [x] **TASK-0103 — Định nghĩa Script và ScriptBatch model** `P0`
  - Script: id, title, content, enabled, order.
  - **Done khi:** Có thể tạo batch từ UI.

- [x] **TASK-0104 — Định nghĩa Run model** `P0`
  - Lưu snapshot profile, selected script IDs, indexes, status, active tab ID.
  - **Done khi:** Có thể phục hồi state sau reload.

- [x] **TASK-0105 — Định nghĩa JobResult và StageResult** `P0`
  - Hỗ trợ attempt history.
  - **Done khi:** Lưu được response theo stage ID.

## EPIC-02 — Storage Layer

- [x] **TASK-0201 — Tạo storage key constants** `P0`
  - **Done khi:** Không hard-code key ở nhiều file.

- [x] **TASK-0202 — Tạo ProfileRepository** `P0`
  - CRUD profile với `chrome.storage.local`.
  - **Phụ thuộc:** TASK-0101.
  - **Done khi:** Reload vẫn đọc được profile.

- [x] **TASK-0203 — Tạo BatchRepository** `P0`
  - CRUD batch và script.
  - **Phụ thuộc:** TASK-0103.

- [x] **TASK-0204 — Tạo RunRepository** `P0`
  - Lưu active Run và run history metadata.
  - **Phụ thuộc:** TASK-0104.

- [x] **TASK-0205 — Tạo IndexedDB wrapper** `P0`
  - Store script content dài, response và result.
  - **Done khi:** Lưu/đọc response dài không lỗi quota nhỏ của storage.

- [x] **TASK-0206 — Tạo ResultRepository** `P0`
  - Lưu StageResult và JobResult.
  - **Phụ thuộc:** TASK-0105, TASK-0205.

- [ ] **TASK-0207 — Tạo migration version cho storage schema** `P1`
  - **Done khi:** Có thể nâng schema mà không xóa dữ liệu cũ.

---

# Phase 2 — Gem Profile Management UI

## EPIC-03 — Danh sách Profile

- [x] **TASK-0301 — Xây dựng danh sách Gem Profile** `P0`
  - Hiển thị name, enabled, stage count.
  - **Done khi:** Dữ liệu lấy từ ProfileRepository.

- [x] **TASK-0302 — Tạo nút New Profile** `P0`
  - Mở editor với dữ liệu mặc định.

- [x] **TASK-0303 — Tạo chức năng chọn profile để edit** `P0`

- [x] **TASK-0304 — Tạo chức năng duplicate profile** `P0`
  - Sinh ID mới.
  - Thêm `Copy` vào tên.

- [x] **TASK-0305 — Tạo chức năng delete profile** `P0`
  - Có confirm.
  - Không cho xóa profile của active Run.

- [x] **TASK-0306 — Tạo enable/disable profile** `P0`

## EPIC-04 — Profile Editor

- [x] **TASK-0401 — Form thông tin profile** `P0`
  - Name, ID, Base URL, Expected Gem Name.

- [x] **TASK-0402 — Validate Base URL** `P0`
  - Chỉ cho phép `https://gemini.google.com/`.

- [x] **TASK-0403 — Stage list editor** `P0`
  - Hiển thị stage theo thứ tự.

- [x] **TASK-0404 — Add Stage** `P0`
  - Chọn `script` hoặc `fixed`.

- [x] **TASK-0405 — Edit Stage** `P0`
  - Name, input type, value, timeout, stableSeconds, retryCount.

- [x] **TASK-0406 — Delete Stage** `P0`
  - Chặn xóa stage output nếu chưa chọn output mới.

- [x] **TASK-0407 — Reorder Stage** `P0`
  - Nút lên/xuống trước.
  - Drag and drop là P1.

- [x] **TASK-0408 — Chọn Output Stage** `P0`

- [x] **TASK-0409 — Cấu hình export** `P0`
  - `per_script`, `combined`, `both`.
  - Filename template.

- [ ] **TASK-0410 — Cấu hình error policy** `P1`

- [x] **TASK-0411 — Save Profile** `P0`
  - Validate đầy đủ.
  - Hiển thị lỗi theo field.

- [x] **TASK-0412 — Profile snapshot utility** `P0`
  - Dùng snapshot khi Run bắt đầu.
  - **Done khi:** Sửa profile trong lúc Run không ảnh hưởng Run hiện tại.

- [ ] **TASK-0413 — Import Profile JSON** `P1`

- [ ] **TASK-0414 — Export Profile JSON** `P1`

---

# Phase 3 — Script Batch UI

## EPIC-05 — Script Editor

- [x] **TASK-0501 — Tạo Script Batch mặc định** `P0`

- [x] **TASK-0502 — Hiển thị danh sách script theo ô** `P0`
  - ID, title, content, enabled.

- [x] **TASK-0503 — Add Script** `P0`

- [x] **TASK-0504 — Edit Script** `P0`

- [x] **TASK-0505 — Delete Script** `P0`
  - Có confirm nếu content không rỗng.

- [x] **TASK-0506 — Duplicate Script** `P0`

- [x] **TASK-0507 — Enable/disable Script** `P0`

- [x] **TASK-0508 — Reorder Script** `P0`

- [x] **TASK-0509 — Character counter** `P0`

- [x] **TASK-0510 — Autosave script draft** `P0`
  - Debounce.
  - Không mất dữ liệu khi reload.

- [x] **TASK-0511 — Validate duplicate Script ID** `P0`

- [ ] **TASK-0512 — Import TXT** `P1`

- [ ] **TASK-0513 — Import JSON batch** `P1`

---

# Phase 4 — Run Configuration

## EPIC-06 — Chuẩn bị Run

- [x] **TASK-0601 — Dropdown chọn Gem Profile** `P0`
  - Chỉ profile enabled.

- [x] **TASK-0602 — Profile flow preview** `P0`
  - Hiển thị URL, stage, output.

- [x] **TASK-0603 — Danh sách chọn Script** `P0`
  - Select All, Clear All.

- [x] **TASK-0604 — Run validation service** `P0`
  - Validate profile, scripts, active Run.

- [x] **TASK-0605 — Tạo Run snapshot** `P0`

- [x] **TASK-0606 — Tạo Job queue từ selected scripts** `P0`

- [x] **TASK-0607 — Nút Start Auto Flow** `P0`

- [x] **TASK-0608 — Ngăn chạy đồng thời nhiều Run** `P0`

---

# Phase 5 — Tab và Messaging Infrastructure

## EPIC-07 — Tab Manager

- [x] **TASK-0701 — Mở Gem tab bằng Tabs API** `P0`
  - Lưu tab ID.

- [x] **TASK-0702 — Chờ tab load hoàn tất** `P0`

- [x] **TASK-0703 — Ping content script** `P0`
  - Retry có giới hạn.

- [x] **TASK-0704 — Đóng tab sau Job** `P0`

- [x] **TASK-0705 — Phát hiện tab bị đóng thủ công** `P0`

- [ ] **TASK-0706 — Recovery active tab sau service worker restart** `P0`

## EPIC-08 — Message Contracts

- [x] **TASK-0801 — Định nghĩa message types** `P0`
  - `PING_PAGE`
  - `VERIFY_GEM`
  - `SEND_STAGE`
  - `CANCEL_WAIT`
  - `GET_PAGE_STATE`

- [x] **TASK-0802 — Chuẩn hóa response envelope** `P0`
  - success, data, errorCode, message.

- [x] **TASK-0803 — Correlation ID cho operation** `P0`
  - Ngăn response nhầm stage.

- [x] **TASK-0804 — Timeout cho message request** `P0`

---

# Phase 6 — Gemini DOM Automation

## EPIC-09 — DOM Adapter

- [x] **TASK-0901 — Tạo selector registry** `P0`
  - Editor.
  - Send button.
  - Stop generating.
  - Response container.
  - Gem title.
  - Error banners.

- [x] **TASK-0902 — Tạo selector fallback** `P0`

- [x] **TASK-0903 — Hàm waitForEditorReady** `P0`

- [x] **TASK-0904 — Hàm getGemName** `P0`

- [x] **TASK-0905 — Hàm isGenerating** `P0`

- [x] **TASK-0906 — Hàm getLatestResponseText** `P0`

- [x] **TASK-0907 — Hàm detectGeminiError** `P0`

## EPIC-10 — Prompt Sender

- [x] **TASK-1001 — Focus editor** `P0`

- [x] **TASK-1002 — Clear editor safely** `P0`

- [x] **TASK-1003 — Insert long text into contenteditable** `P0`
  - Phát input event.
  - Hỗ trợ Unicode và tiếng Nhật.

- [x] **TASK-1004 — Verify inserted content** `P0`
  - So sánh độ dài/hash hợp lý.

- [x] **TASK-1005 — Wait Send button enabled** `P0`

- [x] **TASK-1006 — Click Send** `P0`

- [ ] **TASK-1007 — Ngăn double-send** `P0`
  - Operation lock.

## EPIC-11 — Response Observer

- [ ] **TASK-1101 — Phát hiện response bắt đầu** `P0`

- [ ] **TASK-1102 — Theo dõi DOM bằng MutationObserver** `P0`

- [x] **TASK-1103 — Theo dõi response stable time** `P0`

- [x] **TASK-1104 — Kiểm tra Stop generating biến mất** `P0`

- [x] **TASK-1105 — Kiểm tra editor sẵn sàng lại** `P0`

- [x] **TASK-1106 — Timeout fallback** `P0`

- [ ] **TASK-1107 — Cleanup observer và timer** `P0`

- [x] **TASK-1108 — Trả response text về service worker** `P0`

## EPIC-12 — Error Detection

- [x] **TASK-1201 — Detect LOGIN_REQUIRED** `P0`

- [x] **TASK-1202 — Detect USAGE_LIMIT_REACHED** `P0`

- [x] **TASK-1203 — Detect network/generation error** `P0`

- [ ] **TASK-1204 — Detect empty response** `P0`

- [x] **TASK-1205 — Detect wrong Gem** `P0`

- [x] **TASK-1206 — Chuẩn hóa error code** `P0`

---

# Phase 7 — Flow Engine

## EPIC-13 — Stage Input Resolver

- [x] **TASK-1301 — Resolve stage type script** `P0`

- [x] **TASK-1302 — Resolve stage type fixed** `P0`

- [x] **TASK-1303 — Validate resolved input không rỗng** `P0`

- [ ] **TASK-1304 — Template renderer** `P1`
  - `{{SCRIPT}}`
  - `{{SCRIPT_ID}}`
  - `{{SCRIPT_TITLE}}`
  - `{{PREVIOUS_RESPONSE}}`
  - `{{RESPONSE:stage-id}}`

## EPIC-14 — Job Runner

- [ ] **TASK-1401 — Tạo Job state machine** `P0`

- [ ] **TASK-1402 — Open Gem tab cho Job** `P0`

- [ ] **TASK-1403 — Verify Gem trước khi gửi** `P0`

- [ ] **TASK-1404 — Loop qua stages theo thứ tự** `P0`

- [ ] **TASK-1405 — Gửi stage và chờ response** `P0`

- [ ] **TASK-1406 — Lưu StageResult sau mỗi stage** `P0`

- [ ] **TASK-1407 — Lấy finalOutput theo sourceStageId** `P0`

- [ ] **TASK-1408 — Hoàn tất Job và đóng tab** `P0`

- [ ] **TASK-1409 — Retry Stage có giới hạn** `P0`

- [ ] **TASK-1410 — Retry Job trong tab mới** `P0`

- [ ] **TASK-1411 — Skip Job** `P0`

- [ ] **TASK-1412 — Attempt history** `P1`

## EPIC-15 — Queue Manager

- [ ] **TASK-1501 — Chạy Job tuần tự** `P0`

- [ ] **TASK-1502 — Không mở Job tiếp theo khi Job hiện tại chưa xong** `P0`

- [ ] **TASK-1503 — Cập nhật currentScriptIndex** `P0`

- [ ] **TASK-1504 — Hoàn tất Run khi queue hết** `P0`

- [ ] **TASK-1505 — Tiếp tục queue sau Job skipped** `P0`

---

# Phase 8 — Run Controls và Recovery

## EPIC-16 — Run Controls

- [x] **TASK-1601 — Pause Run** `P0`
  - Pause an toàn sau stage hiện tại.

- [x] **TASK-1602 — Resume Run** `P0`

- [x] **TASK-1603 — Stop Run** `P0`
  - Có confirm.
  - Đóng active automation tab.

- [x] **TASK-1604 — Retry current Stage từ UI** `P0`

- [x] **TASK-1605 — Retry current Job từ UI** `P0`

- [x] **TASK-1606 — Skip current Script từ UI** `P0`

## EPIC-17 — State Recovery

- [ ] **TASK-1701 — Persist state sau khi mở tab** `P0`

- [ ] **TASK-1702 — Persist state trước và sau khi gửi prompt** `P0`

- [ ] **TASK-1703 — Persist state sau khi nhận response** `P0`

- [ ] **TASK-1704 — Khôi phục active Run khi service worker start** `P0`

- [ ] **TASK-1705 — Đồng bộ page state từ content script** `P0`

- [ ] **TASK-1706 — Pause nếu trạng thái gửi prompt không chắc chắn** `P0`

- [ ] **TASK-1707 — Ngăn gửi trùng sau recovery** `P0`

---

# Phase 9 — Run Monitor UI

## EPIC-18 — Monitor

- [ ] **TASK-1801 — Hiển thị Run status** `P0`

- [ ] **TASK-1802 — Hiển thị Script hiện tại và tổng số** `P0`

- [ ] **TASK-1803 — Hiển thị Stage hiện tại và tổng stage** `P0`

- [ ] **TASK-1804 — Hiển thị elapsed time** `P0`

- [x] **TASK-1805 — Hiển thị queue status từng script** `P0`
  - Pending, Running, Completed, Failed, Skipped.

- [x] **TASK-1806 — Hiển thị lỗi hiện tại** `P0`

- [x] **TASK-1807 — Nút Pause/Resume/Stop** `P0`

- [x] **TASK-1808 — Nút Retry Stage/Retry Job/Skip** `P0`

- [ ] **TASK-1809 — Đồng bộ UI qua storage change listener** `P0`

---

# Phase 10 — Result và Export

## EPIC-19 — Result Viewer

- [ ] **TASK-1901 — Danh sách Job Result** `P0`

- [ ] **TASK-1902 — Hiển thị final output** `P0`

- [ ] **TASK-1903 — Hiển thị response từng stage** `P0`

- [ ] **TASK-1904 — Copy output** `P0`

- [ ] **TASK-1905 — Hiển thị attempt history** `P1`

## EPIC-20 — TXT Export

- [ ] **TASK-2001 — Sanitize filename** `P0`

- [ ] **TASK-2002 — Render filename template** `P0`

- [ ] **TASK-2003 — Export TXT per script** `P0`

- [ ] **TASK-2004 — Export TXT combined** `P0`

- [ ] **TASK-2005 — Export both modes** `P0`

- [ ] **TASK-2006 — Auto export khi Run completed** `P0`

- [ ] **TASK-2007 — Không làm mất result khi download lỗi** `P0`

- [ ] **TASK-2008 — Export debug JSON** `P1`

---

# Phase 11 — Testing

## EPIC-21 — Unit Tests

- [ ] **TASK-2101 — Test Profile validator** `P0`

- [ ] **TASK-2102 — Test Run validator** `P0`

- [ ] **TASK-2103 — Test StageInputResolver** `P0`

- [ ] **TASK-2104 — Test filename renderer** `P0`

- [ ] **TASK-2105 — Test state transition rules** `P0`

- [ ] **TASK-2106 — Test repositories** `P0`

## EPIC-22 — Manual Integration Tests

- [ ] **TASK-2201 — Test mở đúng Gem URL** `P0`

- [ ] **TASK-2202 — Test xác minh đúng tên Gem** `P0`

- [ ] **TASK-2203 — Test gửi script dài** `P0`

- [ ] **TASK-2204 — Test flow Script → 2 → 3** `P0`

- [ ] **TASK-2205 — Test ba script chạy tuần tự** `P0`

- [ ] **TASK-2206 — Test Pause và Resume** `P0`

- [ ] **TASK-2207 — Test Stop Run** `P0`

- [ ] **TASK-2208 — Test tab bị đóng thủ công** `P0`

- [ ] **TASK-2209 — Test response timeout** `P0`

- [ ] **TASK-2210 — Test usage limit handling** `P0`

- [ ] **TASK-2211 — Test service worker restart** `P0`

- [ ] **TASK-2212 — Test export TXT** `P0`

## EPIC-23 — Regression Checklist

- [ ] **TASK-2301 — Reload extension không mất profile** `P0`

- [ ] **TASK-2302 — Reload Dashboard không mất script draft** `P0`

- [ ] **TASK-2303 — Không gửi trùng prompt** `P0`

- [ ] **TASK-2304 — Không chạy hai Job cùng lúc** `P0`

- [ ] **TASK-2305 — Không lấy nhầm response stage trước** `P0`

- [ ] **TASK-2306 — Không đóng tab trước khi lưu result** `P0`

---

# Phase 12 — MVP Release

## EPIC-24 — Release Preparation

- [ ] **TASK-2401 — Hoàn thiện README cài đặt bằng Load unpacked** `P0`

- [ ] **TASK-2402 — Thêm hướng dẫn cấu hình Gem Profile** `P0`

- [ ] **TASK-2403 — Thêm hướng dẫn chạy batch script** `P0`

- [ ] **TASK-2404 — Thêm tài liệu xử lý lỗi phổ biến** `P0`

- [ ] **TASK-2405 — Xóa log nhạy cảm và debug thừa** `P0`

- [ ] **TASK-2406 — Kiểm tra permissions tối thiểu** `P0`

- [ ] **TASK-2407 — Đóng gói source MVP** `P0`

- [ ] **TASK-2408 — Chạy smoke test cuối** `P0`

- [ ] **TASK-2409 — Gắn version 0.1.0** `P0`

---

# Phase 13 — Google Sheet Integration

## EPIC-25 — Google Sheet Input

- [ ] **TASK-2501 — Thiết kế Sheet Source Config** `P1`
  - Spreadsheet ID.
  - Sheet name.
  - Start row.
  - URL/script column.
  - Output column.

- [ ] **TASK-2502 — Chọn phương thức xác thực** `P1`
  - Apps Script Web App hoặc Google API.

- [ ] **TASK-2503 — Đọc script theo row** `P1`

- [ ] **TASK-2504 — Map row thành Script ID** `P1`

- [ ] **TASK-2505 — Dừng khi row rỗng** `P1`

- [ ] **TASK-2506 — Bỏ qua row đã có output** `P1`

## EPIC-26 — Google Sheet Output

- [ ] **TASK-2601 — Ghi finalOutput về đúng row** `P1`

- [ ] **TASK-2602 — Ghi status và error** `P1`

- [ ] **TASK-2603 — Retry ghi Sheet** `P1`

- [ ] **TASK-2604 — Không chạy lại row đã hoàn thành** `P1`

---

# Phase 14 — Advanced Features

## EPIC-27 — Template Stage

- [ ] **TASK-2701 — Template parser** `P1`

- [ ] **TASK-2702 — Variable SCRIPT** `P1`

- [ ] **TASK-2703 — Variable PREVIOUS_RESPONSE** `P1`

- [ ] **TASK-2704 — Variable RESPONSE:stage-id** `P1`

- [ ] **TASK-2705 — Preview rendered prompt** `P1`

## EPIC-28 — Multi-Gem Pipeline

- [ ] **TASK-2801 — Thiết kế Pipeline Profile** `P2`

- [ ] **TASK-2802 — Output Gem A làm input Gem B** `P2`

- [ ] **TASK-2803 — Pipeline state recovery** `P2`

- [ ] **TASK-2804 — Pipeline result viewer** `P2`

## EPIC-29 — History và Analytics

- [ ] **TASK-2901 — Run history page** `P2`

- [ ] **TASK-2902 — Filter completed/failed** `P2`

- [ ] **TASK-2903 — Retry failed jobs from history** `P2`

- [ ] **TASK-2904 — Thống kê thời gian trung bình mỗi stage** `P2`

- [ ] **TASK-2905 — Thống kê success rate** `P2`

---

# MVP Completion Checklist

MVP được xem là hoàn thành khi tất cả mục sau được tick:

- [ ] Tạo và lưu được nhiều Gem Profile.
- [ ] Mỗi profile có URL và danh sách stage riêng.
- [ ] Nhập được nhiều script.
- [ ] Chọn profile để chạy một batch script.
- [ ] Mỗi script mở một tab Gem mới.
- [ ] Chạy đúng thứ tự stage.
- [ ] Stage tiếp theo chỉ chạy sau khi response hoàn tất.
- [ ] Lưu response theo từng stage.
- [ ] Lấy đúng output stage.
- [ ] Đóng tab sau khi lưu kết quả.
- [ ] Chạy script tiếp theo.
- [ ] Pause, Resume, Retry, Skip và Stop hoạt động.
- [ ] Service worker restart không làm mất trạng thái.
- [ ] Xuất được TXT theo từng script.
- [ ] Có log và error code cơ bản.
- [ ] Hoàn thành regression checklist.
