# Gemini Gem Auto Flow Extension — Tổng quan dự án

## 1. Giới thiệu

**Gemini Gem Auto Flow Extension** là một Chrome Extension dùng để tự động hóa quy trình xử lý nhiều kịch bản trên các Gem đã được cấu hình sẵn trong giao diện Gemini.

Người dùng nhập một danh sách script, chọn một **Gem Profile**, sau đó extension tự động:

1. Lấy script đầu tiên trong danh sách.
2. Mở URL của Gem tương ứng trong một tab mới.
3. Gửi script vào Gem.
4. Chờ Gemini phản hồi hoàn tất.
5. Chạy tuần tự các stage đã định nghĩa trong Gem Profile.
6. Lấy response tại stage được chọn làm output.
7. Lưu kết quả.
8. Đóng tab hiện tại.
9. Mở tab Gem mới và lặp lại quy trình cho script tiếp theo.
10. Xuất kết quả thành file TXT khi hoàn tất.

---

## 2. Mục tiêu dự án

### 2.1. Mục tiêu chính

- Cho phép cấu hình nhiều Gem Profile.
- Mỗi Gem Profile có URL và danh sách stage riêng.
- Danh sách script được quản lý độc lập với Gem Profile.
- Người dùng chọn một Gem Profile để xử lý một batch script.
- Mỗi script chạy trong một cuộc trò chuyện Gem mới.
- Hệ thống tự chờ response hoàn tất trước khi chạy stage tiếp theo.
- Hệ thống có thể pause, resume, retry, skip hoặc stop.
- Kết quả được lưu theo từng script và xuất ra TXT.

### 2.2. Mục tiêu mở rộng

- Đọc script trực tiếp từ Google Sheet.
- Ghi kết quả trở lại đúng row trong Google Sheet.
- Hỗ trợ import script từ TXT, JSON hoặc Excel.
- Hỗ trợ template variable trong stage.
- Hỗ trợ pipeline nhiều Gem nối tiếp nhau.
- Hỗ trợ lịch sử chạy và chạy lại các job thất bại.
- Hỗ trợ nhiều chiến lược xuất file.

---

## 3. Phạm vi MVP

Phiên bản MVP tập trung vào các chức năng sau:

- Tạo, sửa, sao chép và xóa Gem Profile.
- Khai báo URL Gem.
- Khai báo danh sách stage cho từng profile.
- Hỗ trợ stage loại `script` và `fixed`.
- Nhập nhiều script bằng giao diện extension.
- Chọn một Gem Profile để chạy.
- Chạy tuần tự, mỗi lần chỉ xử lý một script.
- Mở một tab mới cho từng script.
- Tự động nhập prompt và nhấn Send.
- Phát hiện response Gemini hoàn tất.
- Lưu response của từng stage.
- Chọn một stage làm output cuối.
- Xuất file TXT theo từng script.
- Có Start, Pause, Resume, Skip, Retry và Stop.
- Lưu trạng thái chạy bằng `chrome.storage.local`.

Ngoài phạm vi MVP:

- Google Sheet.
- Chạy song song nhiều tab.
- Đồng bộ cloud.
- Gọi trực tiếp Gemini API.
- Tạo profile trình duyệt độc lập.
- Điều phối nhiều tài khoản Google.

---

## 4. Khái niệm nghiệp vụ

### 4.1. Script

Script là nội dung đầu vào cần được Gem xử lý.

```json
{
  "id": "D507",
  "title": "D507",
  "content": "Nội dung kịch bản...",
  "enabled": true
}
```

### 4.2. Script Batch

Script Batch là một danh sách script được chuẩn bị cho một lần chạy.

```json
{
  "id": "batch-001",
  "name": "Kịch bản bóng chày tháng 7",
  "scripts": [
    {
      "id": "D507",
      "title": "D507",
      "content": "Nội dung...",
      "enabled": true
    }
  ]
}
```

### 4.3. Gem Profile

Gem Profile là mẫu cấu hình quy trình của một Gem.

Gem Profile không chứa danh sách script. Nó chỉ chứa:

- Thông tin nhận diện Gem.
- Base URL.
- Danh sách stage.
- Chính sách timeout và retry.
- Stage dùng làm output.
- Cấu hình xuất file.

### 4.4. Stage

Stage là một bước gửi input vào cùng cuộc trò chuyện Gem.

Ví dụ:

```text
Stage 1: gửi script hiện tại
Stage 2: nhập "2"
Stage 3: nhập "3"
```

### 4.5. Run

Run là một lần ghép giữa:

- Một Script Batch.
- Một Gem Profile.
- Danh sách script được chọn.
- Trạng thái thực thi hiện tại.

### 4.6. Job

Mỗi script trong Run tạo thành một Job độc lập.

```text
Run
├── Job D507
├── Job D508
└── Job D509
```

### 4.7. Stage Result

Stage Result chứa:

- Input đã gửi.
- Response nhận được.
- Thời gian bắt đầu và kết thúc.
- Trạng thái.
- Lỗi nếu có.

---

## 5. Luồng nghiệp vụ tổng thể

```text
Người dùng nhập danh sách script
        ↓
Người dùng chọn Gem Profile
        ↓
Hệ thống kiểm tra cấu hình
        ↓
Tạo Run và danh sách Job
        ↓
Lấy Job đầu tiên
        ↓
Mở baseUrl của Gem trong tab mới
        ↓
Chờ giao diện Gemini sẵn sàng
        ↓
Xác minh đúng Gem
        ↓
Chạy Stage 1
        ↓
Chờ response hoàn tất
        ↓
Lưu response
        ↓
Chạy Stage tiếp theo
        ↓
Lặp đến Stage cuối
        ↓
Lấy output theo sourceStageId
        ↓
Lưu kết quả Job
        ↓
Đóng tab
        ↓
Chạy Job tiếp theo
        ↓
Hoàn tất Run
        ↓
Xuất TXT
```

---

## 6. Kiến trúc đề xuất

```text
Chrome Extension
│
├── Dashboard UI
│   ├── Gem Profile Management
│   ├── Script Batch Editor
│   ├── Run Monitor
│   └── Result Viewer
│
├── Background Service Worker
│   ├── Queue Manager
│   ├── Run Manager
│   ├── Job Runner
│   ├── State Recovery
│   └── Tab Manager
│
├── Content Script
│   ├── Gemini DOM Adapter
│   ├── Prompt Sender
│   ├── Response Observer
│   ├── Error Detector
│   └── Response Extractor
│
├── Storage
│   ├── chrome.storage.local
│   └── IndexedDB
│
└── Export
    ├── TXT per script
    ├── TXT combined
    └── JSON debug result
```

---

## 7. Cấu trúc source code đề xuất

```text
gemini-gem-auto-flow/
│
├── manifest.json
│
├── background/
│   ├── service-worker.js
│   ├── queue-manager.js
│   ├── run-manager.js
│   ├── job-runner.js
│   ├── tab-manager.js
│   └── state-recovery.js
│
├── content/
│   ├── gemini-content.js
│   ├── gemini-dom-adapter.js
│   ├── prompt-sender.js
│   ├── response-observer.js
│   ├── response-extractor.js
│   └── error-detector.js
│
├── core/
│   ├── models/
│   │   ├── gem-profile.js
│   │   ├── stage.js
│   │   ├── script.js
│   │   ├── batch.js
│   │   ├── run.js
│   │   └── result.js
│   ├── flow-engine.js
│   ├── stage-input-resolver.js
│   ├── template-renderer.js
│   ├── state-machine.js
│   └── validators.js
│
├── storage/
│   ├── profile-repository.js
│   ├── batch-repository.js
│   ├── run-repository.js
│   ├── result-repository.js
│   └── indexed-db.js
│
├── dashboard/
│   ├── dashboard.html
│   ├── dashboard.css
│   ├── dashboard.js
│   ├── profile-editor.js
│   ├── script-editor.js
│   ├── run-monitor.js
│   └── result-viewer.js
│
├── popup/
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
│
└── export/
    ├── text-exporter.js
    ├── filename-builder.js
    └── output-cleaner.js
```

---

## 8. Mô hình dữ liệu

### 8.1. Gem Profile

```json
{
  "id": "baseball-rewriter",
  "name": "BTV Bóng Chày",
  "baseUrl": "https://gemini.google.com/gem/b5bba85eaf58",
  "expectedGemName": "BTV Bóng Chày (Claude-28/4/26)",
  "enabled": true,
  "stages": [
    {
      "id": "submit-script",
      "name": "Gửi script",
      "order": 1,
      "inputType": "script",
      "inputValue": null,
      "waitForResponse": true,
      "captureResponse": true,
      "timeoutSeconds": 600,
      "stableSeconds": 4,
      "retryCount": 1
    },
    {
      "id": "rewrite",
      "name": "Viết lại",
      "order": 2,
      "inputType": "fixed",
      "inputValue": "2",
      "waitForResponse": true,
      "captureResponse": true,
      "timeoutSeconds": 600,
      "stableSeconds": 4,
      "retryCount": 1
    },
    {
      "id": "finalize",
      "name": "Hoàn thiện",
      "order": 3,
      "inputType": "fixed",
      "inputValue": "3",
      "waitForResponse": true,
      "captureResponse": true,
      "timeoutSeconds": 600,
      "stableSeconds": 4,
      "retryCount": 1
    }
  ],
  "output": {
    "sourceStageId": "finalize",
    "fileMode": "per_script",
    "format": "txt",
    "fileNameTemplate": "{{scriptId}}.txt",
    "includeMetadata": false
  },
  "errorPolicy": {
    "onTimeout": "pause",
    "onEmptyResponse": "retry_stage",
    "onGemMismatch": "stop_run",
    "onUsageLimit": "pause",
    "onTabClosed": "retry_job"
  }
}
```

### 8.2. Run

```json
{
  "id": "run-20260713-001",
  "batchId": "batch-001",
  "profileId": "baseball-rewriter",
  "selectedScriptIds": ["D507", "D508", "D509"],
  "status": "running",
  "currentScriptIndex": 1,
  "currentStageIndex": 2,
  "activeTabId": 123,
  "startedAt": "2026-07-13T10:00:00+07:00",
  "completedAt": null
}
```

### 8.3. Job Result

```json
{
  "runId": "run-20260713-001",
  "profileId": "baseball-rewriter",
  "scriptId": "D507",
  "status": "completed",
  "stageResults": [
    {
      "stageId": "submit-script",
      "status": "completed",
      "input": "Nội dung script...",
      "response": "Response thứ nhất..."
    },
    {
      "stageId": "rewrite",
      "status": "completed",
      "input": "2",
      "response": "Response thứ hai..."
    },
    {
      "stageId": "finalize",
      "status": "completed",
      "input": "3",
      "response": "Kịch bản hoàn chỉnh..."
    }
  ],
  "finalOutput": "Kịch bản hoàn chỉnh..."
}
```

---

## 9. State machine

### 9.1. Run State

```text
PENDING
RUNNING
PAUSED
COMPLETED
CANCELLED
FAILED
```

### 9.2. Job State

```text
PENDING
OPENING_TAB
WAITING_PAGE
VERIFYING_GEM
RUNNING_STAGE
WAITING_RESPONSE
SAVING_RESULT
COMPLETED
SKIPPED
FAILED
```

### 9.3. Stage State

```text
PENDING
RESOLVING_INPUT
SENDING
WAITING_RESPONSE_START
WAITING_RESPONSE_COMPLETE
COMPLETED
TIMEOUT
FAILED
```

---

## 10. Cơ chế xác định response đã hoàn tất

Không dùng thời gian chờ cố định làm điều kiện duy nhất.

Response được xem là hoàn tất khi:

- Gemini đã bắt đầu trả lời.
- Nội dung response mới nhất không còn thay đổi trong khoảng `stableSeconds`.
- Nút Stop generating không còn hiển thị.
- Ô nhập đã sẵn sàng.
- Nút Send có thể dùng lại.
- Không phát hiện thông báo lỗi hoặc usage limit.

Công cụ theo dõi chính:

```text
MutationObserver
+
DOM state inspection
+
timeout fallback
```

---

## 11. Thiết kế UI

### 11.1. Popup

Popup chỉ chứa thao tác nhanh:

- Mở Dashboard.
- Xem Run đang hoạt động.
- Pause.
- Resume.
- Stop.

### 11.2. Dashboard

Dashboard gồm bốn khu vực:

#### Gem Profiles

- Danh sách profile.
- Create.
- Edit.
- Duplicate.
- Delete.
- Enable/disable.
- Import JSON.
- Export JSON.
- Test Profile.

#### Scripts

- Thêm từng script.
- Dán nội dung.
- Sắp xếp thứ tự.
- Enable/disable.
- Xóa.
- Duplicate.
- Đếm ký tự.
- Import TXT trong giai đoạn sau.

#### Run Configuration

- Chọn Gem Profile.
- Xem preview các stage.
- Chọn script cần chạy.
- Chọn chế độ export.
- Bắt đầu Run.

#### Run Monitor

- Script hiện tại.
- Stage hiện tại.
- Thời gian chạy.
- Trạng thái.
- Pause.
- Resume.
- Retry Stage.
- Retry Job.
- Skip Script.
- Stop Run.

---

## 12. Validation

### Gem Profile

- `id` không được trùng.
- `name` không được rỗng.
- `baseUrl` phải thuộc `https://gemini.google.com/`.
- Phải có ít nhất một stage.
- Stage ID không được trùng.
- Phải có một stage sử dụng `inputType = script`.
- `sourceStageId` phải tồn tại.
- Timeout phải lớn hơn 0.
- Stable time phải lớn hơn hoặc bằng 1.
- Retry count không được âm.

### Script Batch

- Phải có ít nhất một script được bật.
- Script ID không được trùng trong cùng batch.
- Script content không được rỗng.

### Trước khi chạy

- Gem Profile đang được bật.
- Có script được chọn.
- Không có Run khác đang chạy.
- Người dùng đã đăng nhập Gemini.
- Extension có quyền truy cập `gemini.google.com`.

---

## 13. Xử lý lỗi

Các mã lỗi chính:

```text
LOGIN_REQUIRED
GEM_PAGE_NOT_READY
GEM_MISMATCH
PROMPT_EDITOR_NOT_FOUND
SEND_BUTTON_NOT_READY
PROMPT_INSERT_FAILED
RESPONSE_NOT_STARTED
RESPONSE_TIMEOUT
EMPTY_RESPONSE
USAGE_LIMIT_REACHED
NETWORK_ERROR
TAB_CLOSED_BY_USER
PROFILE_INVALID
RUN_CANCELLED
```

Các hành động xử lý:

```text
retry_stage
retry_job
skip_script
pause
stop_run
```

---

## 14. Lưu trữ

### chrome.storage.local

Dùng cho:

- Gem Profile.
- Settings.
- Run hiện tại.
- Current script index.
- Current stage index.
- Active tab ID.
- Trạng thái pause/resume.

### IndexedDB

Dùng cho:

- Script dài.
- Toàn bộ response.
- Lịch sử Run.
- Debug log.
- Kết quả chưa export.

---

## 15. Xuất file

### Per Script

```text
D507.txt
D508.txt
D509.txt
```

### Combined

```text
baseball-rewriter_20260713.txt
```

### Both

Xuất đồng thời file riêng và file tổng hợp.

Tên file hỗ trợ template:

```text
{{profileId}}
{{profileName}}
{{batchId}}
{{batchName}}
{{scriptId}}
{{scriptTitle}}
{{timestamp}}
```

---

## 16. Yêu cầu phi chức năng

- Không chạy nhiều script song song trong MVP.
- Không làm mất trạng thái khi service worker tạm dừng.
- Không gửi trùng prompt sau khi reload.
- Không chạy stage tiếp theo khi response chưa hoàn tất.
- Phải lưu tiến độ sau mỗi stage.
- Phải có log đủ để xác định stage thất bại.
- Phải cho phép người dùng can thiệp thủ công khi flow bị pause.
- Selector Gemini phải được tập trung trong một DOM adapter.
- Không lưu thông tin đăng nhập Google.
- Không cố vượt usage limit của Gemini.

---

## 17. Rủi ro kỹ thuật

### Gemini thay đổi DOM

Giải pháp:

- Gom selector vào `gemini-dom-adapter.js`.
- Sử dụng nhiều selector dự phòng.
- Có tính năng Test Profile.
- Có log DOM state khi thất bại.

### Service worker bị dừng

Giải pháp:

- Không giữ trạng thái quan trọng chỉ trong biến RAM.
- Lưu state sau từng hành động.
- Có cơ chế recovery khi service worker khởi động lại.

### Prompt bị gửi trùng

Giải pháp:

- Gắn operation ID cho mỗi stage.
- Lưu trạng thái `SENDING` trước khi gửi.
- Sau reload phải kiểm tra conversation trước khi retry.

### Usage limit

Giải pháp:

- Pause Run.
- Hiển thị lý do.
- Cho phép Resume thủ công.
- Không tự retry vô hạn.

---

## 18. Hướng phát triển sau MVP

1. Google Sheet input/output.
2. Import và export profile.
3. Template variables nâng cao.
4. Pipeline nhiều Gem.
5. Lịch sử Run.
6. Resume sau khi đóng Chrome.
7. Retry có kiểm soát.
8. Xuất Markdown hoặc JSON.
9. Kết nối tool Python local.
10. Dashboard thống kê số script thành công và thất bại.
