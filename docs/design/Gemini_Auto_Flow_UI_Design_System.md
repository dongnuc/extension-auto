# Gemini Auto Flow — UI/UX Design System

## 1. Mục tiêu thiết kế

Gemini Auto Flow là extension hỗ trợ quản lý và tự động hóa luồng làm việc với Gemini Gem.

Thiết kế cần ưu tiên:

- Quản lý Profile Gemini.
- Quản lý Script và Stage.
- Quản lý Batch.
- Import dữ liệu từ Google Sheets.
- Cấu hình và chạy Auto Flow.
- Theo dõi tiến trình chạy.
- Xem kết quả, lịch sử và runtime.
- Giảm thao tác thừa.
- Giảm số lượng button xuất hiện cùng lúc.
- Giữ UI nhất quán giữa các màn hình.
- Dễ mở rộng thêm tính năng automation sau này.

Concept tổng thể:

> **Automation Control Center**

Phong cách:

- Dark SaaS.
- Developer Tool.
- Technical.
- Clean.
- Data-first.
- Status-first.
- Ít màu nhưng có hệ thống.
- Tập trung vào workflow và runtime monitoring.

---

# 2. Concept tổng thể

Tên concept:

**Gemini Auto Flow — Dark Automation System**

## Đặc điểm nhận diện

| Thành phần | Định hướng |
|---|---|
| Phong cách | Dark SaaS / Developer Tool |
| Cảm giác | Technical, clean, automation, reliable |
| Màu chủ đạo | Navy + Electric Blue |
| Màu phụ | Violet |
| Success | Emerald Green |
| Warning | Amber |
| Error | Red |
| Border | Blue-gray tối |
| Icon | Outline |
| Card | Bo góc vừa |
| Shadow | Nhẹ hoặc gần như không dùng |
| Ưu tiên | Data → Status → Action |

Không nên thiết kế theo hướng dashboard marketing có nhiều gradient, glow hoặc nhiều màu.

Ứng dụng nên có cảm giác gần với:

- GitHub
- Linear
- Vercel
- Azure Portal
- Developer Console

---

# 3. Nguyên tắc màu

Toàn bộ UI chỉ nên xoay quanh các màu chính:

```text
BLUE    = Action / Running
GREEN   = Success
ORANGE  = Warning
RED     = Error
GRAY    = Neutral / Pending / Disabled
VIOLET  = Automation type / Fixed Stage
```

Không dùng màu ngẫu nhiên cho từng màn hình.

---

# 4. Background Color System

## 4.1 Color Tokens

| Token | Hex | Sử dụng |
|---|---|---|
| `bg-app` | `#07111F` | Background toàn ứng dụng |
| `bg-sidebar` | `#091525` | Sidebar |
| `bg-surface` | `#0C1829` | Card / panel chính |
| `bg-surface-2` | `#101E32` | Input / child card |
| `bg-hover` | `#142640` | Hover |
| `bg-selected` | `#163567` | Item được chọn |

## 4.2 Layer hierarchy

```text
#07111F  App
   ↓
#091525  Navigation
   ↓
#0C1829  Card
   ↓
#101E32  Input / Child Card
   ↓
#142640  Hover
```

Mục đích:

- Giữ toàn bộ UI dark.
- Vẫn nhìn được hierarchy.
- Không cần dùng shadow quá mạnh.
- Dễ phân biệt panel cha/con.

---

# 5. Primary Color

## 5.1 Primary Palette

| Token | Hex |
|---|---|
| `primary-50` | `#EFF6FF` |
| `primary-100` | `#DBEAFE` |
| `primary-300` | `#93C5FD` |
| `primary-400` | `#60A5FA` |
| `primary-500` | `#3B82F6` |
| `primary-600` | `#2563EB` |
| `primary-700` | `#1D4ED8` |
| `primary-900` | `#172554` |

## 5.2 Primary Button

```text
Background: #2563EB
Hover:      #1D4ED8
Text:       #FFFFFF
```

Chỉ dùng primary button cho hành động quan trọng:

- Start Run
- Run Now
- Import
- Save
- Create
- Add Profile
- Add Batch

Không dùng primary cho:

- Delete
- View
- Edit
- Duplicate
- Open detail

---

# 6. Status Color System

Status là phần quan trọng nhất vì extension có nhiều trạng thái runtime.

| Status | Text/Icon | Background nhẹ |
|---|---|---|
| Pending | `#94A3B8` | `#172033` |
| Queued | `#A78BFA` | `#251D45` |
| Running | `#3B82F6` | `#122B52` |
| Success | `#22C55E` | `#102D22` |
| Warning | `#F59E0B` | `#35250D` |
| Failed | `#EF4444` | `#35151A` |
| Skipped | `#64748B` | `#182131` |
| Disabled | `#64748B` | `#111827` |

Ví dụ:

```text
● Pending
● Running
✓ Success
! Warning
× Failed
– Skipped
```

Quy tắc:

> Cùng một status phải sử dụng cùng một màu ở Run, Monitor, Results, History và Calendar.

---

# 7. Text Color

| Token | Hex | Sử dụng |
|---|---|---|
| `text-primary` | `#E6EDF7` | Heading / giá trị chính |
| `text-secondary` | `#A8B6CC` | Description |
| `text-muted` | `#718096` | Metadata |
| `text-disabled` | `#4B5B70` | Disabled |
| `text-link` | `#60A5FA` | Link / URL |

Không nên dùng `#FFFFFF` cho toàn bộ text vì tương phản quá mạnh trên nền dark.

---

# 8. Border System

## Default

```text
Default border: #223249
```

## Input

```text
Input border: #293A53
```

## Hover

```text
Hover border: #365274
```

## Focus

```text
Focus border: #3B82F6
Focus shadow: rgba(59, 130, 246, 0.12)
```

Ví dụ:

```css
border: 1px solid #293A53;
box-shadow: 0 0 0 3px rgba(59,130,246,.12);
```

## Danger

```text
Danger border: #7F1D1D
```

---

# 9. Typography

Khuyến nghị sử dụng:

- Inter
- Geist

Nếu muốn hỗ trợ tiếng Việt tốt và dễ triển khai:

> **Inter** là lựa chọn ưu tiên.

## Font scale

| Element | Size | Weight |
|---|---:|---:|
| Page title | 24px | 700 |
| Section title | 18px | 600–650 |
| Card title | 15–16px | 600 |
| Body | 14px | 400 |
| Label | 13px | 500 |
| Metadata | 12px | 400 |
| Badge | 12px | 500 |

Không cần dùng heading quá lớn.

Đây là tool desktop / extension nên ưu tiên mật độ thông tin.

---

# 10. Icon Concept

## 10.1 Icon Library

Khuyến nghị:

> **Lucide Icons**

Lý do:

- Phong cách outline.
- Phù hợp developer tool.
- Dễ dùng với React.
- Icon đồng nhất.
- Không quá nặng.

## 10.2 Quy chuẩn

```text
Style: Outline
Stroke: 1.75px
Navigation icon: 18px
Button icon: 16px
Status icon: 14px
KPI icon: 20–22px
```

Không trộn nhiều thư viện:

- Lucide
- FontAwesome
- Material Icons
- Emoji

Chỉ sử dụng một bộ icon.

---

# 11. Icon Mapping

## Navigation

| Module | Lucide Icon |
|---|---|
| Dashboard | `LayoutDashboard` |
| Profiles | `Bot` |
| Scripts | `FileText` |
| Batches | `Layers3` |
| Google Sheets / Data Sources | `Sheet` |
| Run | `Play` |
| Monitor | `Activity` |
| Results | `SquareCheckBig` |
| History | `History` |
| Schedule | `CalendarClock` |
| Settings | `Settings` |

## Action Icons

| Action | Icon |
|---|---|
| Add | `Plus` |
| Edit | `Pencil` |
| Delete | `Trash2` |
| Duplicate | `Copy` |
| Run | `Play` |
| Stop | `Square` |
| Retry | `RefreshCcw` |
| Open tab | `ExternalLink` |
| Download | `Download` |
| Upload | `Upload` |
| Import | `FileInput` |
| Export | `FileOutput` |
| Save | `Save` |
| Search | `Search` |
| Filter | `SlidersHorizontal` |
| More | `Ellipsis` |
| Drag | `GripVertical` |
| Move Up | `ArrowUp` |
| Move Down | `ArrowDown` |

---

# 12. Button System

Toàn app chỉ nên có 5 loại button.

## 12.1 Primary

Dùng cho hành động chính.

```text
[ ▶ Start Run ]
```

Ví dụ:

- Start Run
- Import Sheet
- Save
- Create

---

## 12.2 Secondary

Dùng cho hành động phụ.

```text
[ Import Sheet ]
[ Save Draft ]
```

---

## 12.3 Ghost

Dùng cho hành động nhẹ.

```text
View details
Open
Preview
```

---

## 12.4 Danger

Chỉ dùng trong:

- Confirmation dialog.
- Delete menu.
- Critical action.

Không nên để nhiều nút đỏ lớn trên UI.

---

## 12.5 Icon Button

Dùng cho thao tác nhanh:

```text
[Pencil]
[Copy]
[Trash]
[...]
```

---

# 13. Giảm số lượng Button trên UI

Ví dụ hiện tại:

```text
Up
Down
Disable
Delete
```

Nên đổi thành:

```text
⠿ Script 01                 Enabled

                           ↑   ↓   ⋯
```

Menu `⋯`:

```text
Edit
Duplicate
Disable
Delete
```

Lợi ích:

- Gọn hơn.
- Giảm visual noise.
- Dễ mở rộng thêm action.
- UI chuyên nghiệp hơn.

---

# 14. Spacing System

Sử dụng hệ thống:

> **8px Grid**

## Spacing Tokens

```text
4px   = very small
8px   = icon / inline
12px  = related controls
16px  = component spacing
24px  = card padding
32px  = section spacing
40px  = major area
```

Không đặt spacing ngẫu nhiên.

---

# 15. Border Radius

## Card

```text
12px
```

## Input

```text
8px
```

## Button

```text
8px
```

## Badge

```text
6px hoặc pill
```

Không nên sử dụng radius 20–24px cho tất cả thành phần.

---

# 16. Sidebar Design

Cấu trúc đề xuất:

```text
✦ Gemini Auto Flow

Dashboard

BUILD
Profiles
Scripts
Batches
Data Sources

AUTOMATION
Run
Monitor
Schedule

DATA
Results
History

Settings
```

Khi code, thay icon minh họa bằng Lucide Icon.

---

# 17. Sidebar Color State

## Default

```text
Icon: #8392A8
Text: #A8B6CC
```

## Hover

```text
Background: #101E32
Icon: #CBD5E1
```

## Selected

```text
Background: #163567
Icon: #60A5FA
Text: #F1F5F9
Left indicator: #3B82F6
```

Khuyến nghị thêm một thanh active ở bên trái item.

Ví dụ:

```text
▌ Run
```

Không cần tô nguyên item thành blue quá sáng.

---

# 18. Input System

Mỗi input nên theo cấu trúc:

```text
Label
Input
Helper / Error
```

Ví dụ:

```text
Gemini Base URL *

https://gemini.google.com/gem/xxxx

✓ Gemini profile detected
```

## Validation Error

Ví dụ:

```text
Start row: 10
End row: 5
```

UI phải báo:

```text
⚠ End row cannot be less than Start row.
```

Không chờ tới lúc import mới báo lỗi.

---

# 19. Table System

Không nên biến mọi row thành card lớn.

Ưu tiên table compact.

Ví dụ:

```text
☐  Script     Status       Chars    Result      Action

☐  S001       ● Ready       2450       —          ⋯
☐  S002       ● Running     2180      48%         ⋯
☐  S003       ✓ Success     3021      Done        ⋯
```

## Table Row Height

```text
48–56px
```

## Table Header

```text
12px
text-muted
weight: 500
```

---

# 20. Stage Type Color System

Stage type nên có màu riêng để phân loại.

| Stage Type | Color |
|---|---|
| Script Stage | Blue |
| Fixed Prompt | Violet |
| Transform | Cyan |
| Output | Green |

Ví dụ:

```text
● Script Input
     │
     ▼
● Analyze
     │
     ▼
● Rewrite
     │
     ▼
● Final Output
```

Lưu ý:

> Stage color không được thay thế status color.

Ví dụ:

Fixed Stage = Violet.

Nhưng nếu Fixed Stage lỗi:

```text
Type: Violet
Status: Red
```

---

# 21. Run Status Visual Language

Màn Run phải là màn quan trọng nhất.

Ví dụ:

```text
AUTO FLOW #RUN-96BFE5D9

● Running

████████████░░░░░░  4 / 7

✓ S001   Completed       32s
✓ S002   Completed       46s
◉ S003   Running         18s
○ S004   Waiting
○ S005   Waiting
○ S006   Waiting
○ S007   Waiting
```

Người dùng phải nhìn được ngay:

- Batch nào đang chạy.
- Profile nào đang chạy.
- Đã chạy bao nhiêu script.
- Script hiện tại.
- Script nào lỗi.
- Script nào pending.
- Thời gian chạy.
- Tab ID.
- Output đã lấy hay chưa.

---

# 22. Runtime Status Icons

Chuẩn hóa:

```text
○ Pending
◉ Running
✓ Completed
! Warning
× Failed
– Skipped
```

Luôn kết hợp:

- Icon
- Text
- Color

Không chỉ sử dụng màu.

---

# 23. Navigation Structure

Cấu trúc navigation cuối cùng khuyến nghị:

```text
Dashboard

Profiles

Scripts
Batches
Data Sources

Run
Monitor
Schedule

Results
History

Settings
```

Nếu muốn tối giản hơn nữa:

```text
Setup
Scripts
Run
Monitor
History
```

Trong đó:

### Setup

Bao gồm:

- Profiles
- Google Sheets / Data Sources
- Global Settings

### Scripts

Bao gồm:

- Script
- Stage
- Batch

### Run

Bao gồm:

- Run Configuration
- Launch Preview
- Start Flow

### Monitor

Bao gồm:

- Running Tabs
- Runtime
- Progress
- Error
- Retry

### History

Bao gồm:

- Results
- Run History
- Schedule History
- Recover Run

---

# 24. Screen Structure

## 24.1 Dashboard

Hiển thị:

- Profiles.
- Batches.
- Total Scripts.
- Runs Today.
- Success / Failed.
- Recent Runs.
- Quick Run.
- Upcoming Schedules.
- Extension status.

Dashboard chỉ để tổng quan.

Không đặt cấu hình chi tiết tại Dashboard.

---

# 25. Profile Screen

## List

```text
Search Profiles

Profile Name
Gem URL
Output Stage
Export Mode
Status
Actions
```

## Edit Profile

Chia thành các tab:

```text
Basic Information
Stages
Output
Advanced
```

Không hiển thị toàn bộ field một lúc.

---

# 26. Script Management

Layout:

```text
┌ Script List ┐  ┌ Script Editor ┐
│ Script 01   │  │ NumberNo      │
│ Script 02   │  │ Video Title   │
│ Script 03   │  │ Status        │
│             │  │ Content       │
└─────────────┘  └───────────────┘
```

Script list nên có:

- Search.
- Filter.
- Status.
- Character count.
- More menu.

---

# 27. Stage Builder

Layout:

```text
Stage List              Stage Detail

1 Script Input          Stage name
2 Fixed Prompt          Type
3 Rewrite               Timeout
4 Final Output          Stable seconds
                        Retry count
                        Stage value
```

Cho phép:

- Drag reorder.
- Duplicate.
- Delete.
- Mark output stage.

---

# 28. Batch Management

Batch không nên là một màn form lớn.

Layout:

```text
Batch List

Default Batch      6 scripts
Mùa Mưa            7 scripts
Bóng Cháy          4 scripts
```

Khi chọn:

```text
Scripts in Batch

☐ S001
☐ S002
☐ S003
```

Actions:

- Add Script.
- Remove.
- Duplicate.
- Sort.
- Run batch.

---

# 29. Google Sheets / Data Sources

Không nên để quá nhiều field hiển thị cùng lúc.

Chia thành wizard:

```text
1 Connect
2 Map Columns
3 Preview
4 Import
```

## Step 1 — Connect

- Config.
- Sheet.
- Apps Script URL.
- API Key.
- Test Connection.

## Step 2 — Mapping

- NumberNo.
- Title.
- Content.
- Output.
- Translate From.
- Translate Output.
- YouTube URL.
- Transcript.
- Caption Language.

## Step 3 — Preview

Hiển thị 5–10 rows.

Validation:

- Missing title.
- Missing content.
- Duplicate.
- Invalid range.

## Step 4 — Import

```text
126 rows detected
120 valid
6 warning
```

---

# 30. Run Configuration

Layout nên chia 2 cột.

```text
Run Configuration       Launch Preview
```

## Config

- Profile.
- Batch.
- Script field.
- All scripts / Selected scripts.
- Keep tabs open.
- Auto collect output.
- Retry failed script.

## Preview

- Profile.
- Base URL.
- Batch.
- Number of scripts.
- Tabs to open.

Primary action:

```text
▶ Start Run
```

---

# 31. Live Monitor

Đây là màn thay thế `Launch runtime table` quá rộng hiện tại.

Layout đề xuất:

```text
Run Summary

Progress

Job List                  Job Detail
```

## Run Summary

```text
Running

4 / 7 completed

Elapsed: 03:42
```

## Job List

```text
✓ Script 01
✓ Script 02
◉ Script 03
○ Script 04
○ Script 05
```

## Job Detail

```text
Script
Tab ID
Conversation URL
Submitted content
Output
Error
Retry
Open tab
Write back Sheet
```

Không hiển thị tất cả thông tin của mọi script theo chiều ngang.

---

# 32. Results

Results nên dùng master-detail.

```text
Runs           Jobs             Result Detail
```

## Runs

```text
run-fca3b03b
BTV Xe ô tô
Completed
6/6
```

## Jobs

```text
S001 Success
S002 Success
S003 Failed
```

## Detail

- Submitted content.
- Stage responses.
- Final output.
- Copy.
- Export.
- Write to Google Sheet.
- Open Gemini conversation.

---

# 33. History

Gộp:

- Results.
- Run Calendar.
- Archived Run.

Có thể filter:

```text
Date
Profile
Batch
Status
```

Không nhất thiết phải có màn Calendar riêng nếu chỉ dùng để xem lịch sử.

Calendar chỉ cần giữ lại nếu có chức năng Schedule.

---

# 34. Schedule

Nếu extension hỗ trợ lịch tự chạy:

```text
Schedule Name
Profile
Batch
Time
Repeat
Enabled
Last Run
Next Run
```

Các trạng thái:

```text
Enabled
Paused
Expired
```

---

# 35. Empty State

Không để panel trống hoàn toàn.

Ví dụ:

```text
No scripts in this batch.

Add scripts manually or import them from Google Sheets.

[ Add Script ]
[ Import Sheet ]
```

---

# 36. Error State

Ví dụ:

```text
Gemini tab connection failed

The extension could not find the expected Gem page.

[ Retry ]
[ Open Profile ]
```

Không chỉ hiển thị error message kỹ thuật.

---

# 37. Toast System

Success:

```text
✓ Profile saved
```

Warning:

```text
! 3 scripts were skipped
```

Error:

```text
× Failed to write output to Google Sheet
```

Toast nên tự đóng sau vài giây, ngoại trừ lỗi nghiêm trọng.

---

# 38. Confirmation Dialog

Delete:

```text
Delete profile?

Profile "BTV Bóng Cháy" will be permanently removed.

[ Cancel ] [ Delete ]
```

Không delete trực tiếp ngay khi click trash.

---

# 39. Component Structure

```text
/design-system

01-foundation
    colors
    typography
    spacing
    radius
    border

02-icons
    navigation
    actions
    status
    stage-types

03-components
    button
    input
    select
    checkbox
    toggle
    badge
    card
    modal
    table
    tabs
    progress
    toast

04-patterns
    page-header
    list-editor
    master-detail
    wizard
    run-monitor
    empty-state

05-pages
    dashboard
    profiles
    scripts
    batches
    sources
    run
    monitor
    schedule
    results
    history
```

---

# 40. CSS Variable Recommendation

Có thể dùng trực tiếp như sau:

```css
:root {
  --bg-app: #07111F;
  --bg-sidebar: #091525;
  --bg-surface: #0C1829;
  --bg-surface-2: #101E32;
  --bg-hover: #142640;
  --bg-selected: #163567;

  --primary-400: #60A5FA;
  --primary-500: #3B82F6;
  --primary-600: #2563EB;
  --primary-700: #1D4ED8;

  --success: #22C55E;
  --warning: #F59E0B;
  --danger: #EF4444;
  --violet: #A78BFA;

  --text-primary: #E6EDF7;
  --text-secondary: #A8B6CC;
  --text-muted: #718096;
  --text-disabled: #4B5B70;
  --text-link: #60A5FA;

  --border-default: #223249;
  --border-input: #293A53;
  --border-hover: #365274;
  --border-focus: #3B82F6;

  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
}
```

---

# 41. Quy tắc bắt buộc khi implement

## Rule 1

Không tự tạo màu mới cho từng screen.

---

## Rule 2

Status phải đồng nhất toàn hệ thống.

---

## Rule 3

Primary Button chỉ dành cho hành động chính.

Mỗi section nên có tối đa:

> **1 primary action**

---

## Rule 4

Các action ít dùng phải đưa vào menu `...`.

---

## Rule 5

Form dài phải chia thành:

- Tab.
- Step.
- Section.

Không để toàn bộ field trong một màn hình.

---

## Rule 6

Không sử dụng table quá rộng cho runtime.

Runtime nên dùng master-detail.

---

## Rule 7

Không dùng màu để truyền tải trạng thái một mình.

Luôn dùng:

```text
Icon + Text + Color
```

---

## Rule 8

Không dùng emoji làm icon trong bản production.

---

## Rule 9

Không dùng radius quá lớn.

UI automation nên compact và technical.

---

## Rule 10

Toàn extension phải nhìn như một sản phẩm duy nhất.

Không thiết kế từng màn hình theo concept riêng.

---

# 42. Concept cuối cùng

Gemini Auto Flow nên được xây dựng theo công thức:

```text
Dark Navy
    +
Electric Blue
    +
Neutral Blue Gray
    +
Clear Status Colors
    +
Lucide Outline Icons
    +
Compact Developer UI
```

Flow chính:

```text
Profile
   ↓
Script
   ↓
Batch
   ↓
Data Source
   ↓
Run
   ↓
Monitor
   ↓
Result
   ↓
History
```

Đây phải là flow được phản ánh trực tiếp trong navigation và UI.

---

# 43. Mục tiêu UX cuối cùng

Người dùng cần có thể thực hiện luồng phổ biến:

```text
Chọn Profile
    ↓
Chọn / Import Scripts
    ↓
Chọn Batch
    ↓
Start Run
    ↓
Theo dõi Auto Flow
    ↓
Xử lý Error nếu có
    ↓
Collect Output
    ↓
Write Back Google Sheet
    ↓
Xem History
```

với số bước tối thiểu và không phải chuyển qua quá nhiều màn hình.

---

# 44. Kết luận

Không nên xem Gemini Auto Flow chỉ là một dashboard chứa nhiều form.

Nên xem nó là:

> **Automation Control Center dành cho Gemini Gem**

Trong đó toàn bộ UI phải phục vụ ba nhiệm vụ chính:

1. **Setup nhanh**
2. **Run dễ**
3. **Monitor rõ**

Các phần Profile, Script, Batch, Google Sheets, Runtime và Results chỉ là những thành phần hỗ trợ cho ba luồng chính này.

Khi implement UI mới, ưu tiên chuẩn hóa Design System trước rồi mới sửa từng màn hình để tránh lặp lại vấn đề UI thiếu đồng nhất.
