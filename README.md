# Gemini Gem Auto Flow Extension

Chrome Extension hỗ trợ tự động hóa quy trình chạy nhiều `script` tuần tự trên các Gem đã cấu hình sẵn trong Gemini.

Hiện tại project đã có nền tảng MVP gồm:
- Dashboard quản lý `Gem Profile`
- Dashboard quản lý `Script Batch`
- Storage local cho cấu hình và dữ liệu nền
- Popup mở nhanh Dashboard

---

## 1. Mục đích của extension

Bạn chuẩn bị:
- một danh sách script đầu vào
- một Gem Profile mô tả cách gửi prompt theo từng stage

Sau đó extension sẽ hướng tới việc:
1. Mở Gem URL tương ứng
2. Gửi script hoặc prompt cố định theo từng stage
3. Chờ phản hồi hoàn tất
4. Lấy output ở stage được chọn
5. Lưu kết quả cho từng script

Ở thời điểm hiện tại, phần UI và cấu hình nền tảng đã có. Các phase tiếp theo sẽ hoàn thiện phần chạy tự động end-to-end.

---

## 2. Cài đặt và chạy project

### 2.1. Cài dependency

```bash
npm install
```

### 2.2. Build project

```bash
npm run build
```

### 2.3. Load extension vào Chrome

1. Mở `chrome://extensions`
2. Bật `Developer mode`
3. Chọn `Load unpacked`
4. Chọn thư mục:

```text
e:\coding\Tools\Extensions-auto-gem\dist
```

### 2.4. Mở giao diện extension

Sau khi load:
- bấm icon extension trên thanh công cụ Chrome
- popup sẽ hiện nút `Open Dashboard`
- bấm nút đó để mở giao diện quản trị

---

## 3. Các lệnh phát triển

### Chạy lint

```bash
npm run lint
```

### Build production

```bash
npm run build
```

### Chạy dev

```bash
npm run dev
```

Lưu ý: với Chrome Extension, cách dễ test nhất hiện tại là `npm run build` rồi load thư mục `dist`.

---

## 4. Cách sử dụng tổng quan

Dashboard hiện có 4 khu vực chính:
- `Profiles`
- `Scripts`
- `Run`
- `Results`

Hiện tại đã dùng được tốt nhất ở:
- `Profiles`: tạo và quản lý cấu hình Gem
- `Scripts`: tạo và quản lý batch script

---

## 5. Hướng dẫn tab Profiles

Tab `Profiles` dùng để tạo cấu hình chạy cho một Gem.

Mỗi profile mô tả:
- chạy trên Gem URL nào
- có bao nhiêu stage
- stage nào là output cuối
- cách export tên file
- policy xử lý lỗi cơ bản

### 5.1. New Profile

Nút `New Profile` tạo một profile mới với dữ liệu mặc định:
- 1 stage loại `script`
- `baseUrl` mặc định là `https://gemini.google.com/`
- export mode mặc định là `per_script`

### 5.2. Duplicate

Nút `Duplicate` sao chép profile đang chọn.

Dùng khi:
- bạn có một flow gần giống flow cũ
- chỉ muốn sửa vài stage hoặc URL

### 5.3. Delete

Nút `Delete` xóa profile đang chọn khỏi storage local.

Nên dùng khi:
- profile không còn sử dụng
- bạn muốn dọn bớt các cấu hình thử nghiệm

---

## 6. Giải thích từng trường cấu hình trong Profile

### 6.1. Profile ID

Ví dụ:
- `profile-seo-basic`
- `profile-longform-v1`

Ý nghĩa:
- là mã định danh nội bộ của profile
- dùng để phân biệt các profile với nhau

Khuyến nghị:
- nên đặt ngắn gọn
- không nên trùng nhau
- nên dùng tiền tố theo nhóm nghiệp vụ nếu bạn có nhiều profile

### 6.2. Profile Name

Ví dụ:
- `SEO Blog Writer`
- `YouTube Script Refiner`

Ý nghĩa:
- là tên hiển thị trên giao diện
- giúp bạn nhận biết profile nhanh hơn

Khuyến nghị:
- đặt tên theo mục đích thực tế
- nên đủ rõ để người khác nhìn vào cũng hiểu profile dùng làm gì

### 6.3. Base URL

Ví dụ hợp lệ:

```text
https://gemini.google.com/
https://gemini.google.com/app/...
```

Ý nghĩa:
- là URL Gem hoặc trang Gemini mà extension sẽ mở để chạy flow

Ràng buộc hiện tại:
- phải bắt đầu bằng `https://gemini.google.com/`

Khi nào dùng:
- nếu bạn có một Gem cụ thể, hãy dán đúng URL của Gem đó
- nếu chưa có URL cụ thể, có thể tạm để URL gốc Gemini

### 6.4. Expected Gem Name

Ví dụ:
- `SEO Writer`
- `Content Planner`

Ý nghĩa:
- là tên Gem bạn kỳ vọng extension đang mở đúng
- hiện tại trường này chủ yếu dùng để chuẩn bị cho bước verify ở phase sau

Khi nào nên điền:
- nên điền nếu bạn có nhiều Gem gần giống nhau
- có thể để trống nếu chưa cần verify tên Gem

### 6.5. Availability

Giá trị:
- `Enabled`
- `Disabled`

Ý nghĩa:
- `Enabled`: profile sẵn sàng để dùng cho run
- `Disabled`: profile vẫn được lưu nhưng nên được xem là tạm ẩn hoặc tạm ngưng sử dụng

Khi nào dùng `Disabled`:
- profile đang thử nghiệm
- profile cũ chưa muốn xóa
- profile đang bị lỗi tạm thời

### 6.6. Output Stage

Ý nghĩa:
- chọn stage nào sẽ được xem là kết quả cuối cùng của mỗi script

Ví dụ:
- Stage 1 gửi script thô
- Stage 2 gửi prompt tinh chỉnh
- Stage 3 gửi prompt định dạng cuối
- nếu bạn muốn lấy phản hồi từ Stage 3 làm output cuối, hãy chọn Stage 3

Khuyến nghị:
- thường nên chọn stage cuối cùng
- chỉ chọn stage giữa nếu đó là nơi có nội dung bạn thật sự cần xuất ra

### 6.7. Export Mode

Giá trị:
- `per_script`
- `combined`
- `both`

Ý nghĩa:
- `per_script`: mỗi script xuất thành một file riêng
- `combined`: gộp toàn bộ kết quả vào một file
- `both`: vừa file riêng vừa file gộp

Khi nào dùng:
- `per_script`: phù hợp khi mỗi script là một đầu việc độc lập
- `combined`: phù hợp khi muốn rà soát toàn bộ output trong một file
- `both`: phù hợp khi vừa muốn quản lý chi tiết vừa muốn có file tổng hợp

### 6.8. Filename Template

Ví dụ:
- `{{scriptId}}.txt`
- `output-{{scriptId}}.txt`
- `blog-{{scriptId}}-final.txt`

Ý nghĩa:
- là mẫu tên file khi export

Khuyến nghị:
- nên chứa `{{scriptId}}` để tránh đè file
- nên thêm tiền tố nghiệp vụ nếu bạn có nhiều loại batch

Ví dụ tốt:
- `seo-{{scriptId}}.txt`
- `gem-output-{{scriptId}}.txt`

### 6.9. Profile Retry Count

Ý nghĩa:
- số lần thử lại ở cấp profile hoặc flow khi lỗi

Ví dụ:
- `0`: không retry
- `1`: thử lại 1 lần
- `2`: thử lại 2 lần

Khi nào tăng giá trị này:
- Gemini phản hồi không ổn định
- trang load chậm hoặc thỉnh thoảng lỗi tạm thời

Khuyến nghị ban đầu:
- dùng `1` hoặc `2`
- không nên để quá cao vì dễ kéo dài thời gian batch

### 6.10. On Stage Failure

Giá trị:
- `Stop run`
- `Continue run`

Ý nghĩa:
- `Stop run`: nếu 1 stage lỗi thì dừng flow
- `Continue run`: nếu 1 stage lỗi thì vẫn cố chạy tiếp

Khi nào dùng:
- `Stop run`: dùng khi mỗi stage phụ thuộc chặt vào stage trước
- `Continue run`: dùng khi bạn chấp nhận một số lỗi và muốn gom kết quả tối đa

Khuyến nghị:
- với flow tạo nội dung nhiều bước, thường nên dùng `Stop run`

---

## 7. Giải thích từng trường trong Stage

Mỗi profile có một hoặc nhiều stage.

Stage là từng bước prompt được gửi trong cùng một cuộc trò chuyện Gem.

### 7.1. Stage Name

Ví dụ:
- `Initial Script Input`
- `Refine Outline`
- `Format Final Answer`

Ý nghĩa:
- tên hiển thị của stage
- giúp bạn hiểu stage đó dùng để làm gì

Khuyến nghị:
- đặt theo hành động cụ thể
- tránh đặt tên quá chung như `Stage 1`, `Stage 2` nếu flow phức tạp

### 7.2. Type

Giá trị hiện hỗ trợ:
- `script`
- `fixed`

#### `script`
Ý nghĩa:
- lấy nội dung script hiện tại làm input cho stage

Khi dùng:
- dùng cho stage đầu tiên trong đa số trường hợp
- dùng khi muốn đưa nguyên nội dung đầu vào cho Gem

#### `fixed`
Ý nghĩa:
- gửi một chuỗi cố định do bạn tự nhập

Khi dùng:
- dùng cho stage hướng dẫn tiếp theo
- ví dụ yêu cầu Gem chuyển format, rút gọn, tiếp tục, hoặc xuất JSON

Ví dụ flow:
- Stage 1 = `script`
- Stage 2 = `fixed` với giá trị: `Hãy viết lại nội dung trên theo giọng văn chuyên nghiệp.`
- Stage 3 = `fixed` với giá trị: `Xuất kết quả cuối cùng ở định dạng bullet list.`

### 7.3. Stage Value

Ý nghĩa:
- nội dung prompt cố định cho stage loại `fixed`

Lưu ý:
- với `script`, trường này hiện bị disable vì input đến từ script hiện tại
- với `fixed`, trường này là bắt buộc

Ví dụ:

```text
Hãy tóm tắt nội dung trên thành 5 ý chính.
```

hoặc

```text
Viết lại nội dung theo phong cách thân thiện, rõ ràng và có CTA ở cuối.
```

### 7.4. Timeout (ms)

Ý nghĩa:
- thời gian chờ tối đa cho một stage, tính bằng milliseconds

Ví dụ:
- `30000` = 30 giây
- `60000` = 60 giây
- `120000` = 120 giây

Khi nào tăng:
- prompt dài
- Gem phản hồi chậm
- nội dung đầu ra lớn

Khuyến nghị:
- bắt đầu với `60000` hoặc `120000`

### 7.5. Stable Seconds

Ý nghĩa:
- số giây phản hồi cần ổn định trước khi coi là hoàn tất

Dễ hiểu hơn:
- nếu UI Gemini ngừng thay đổi trong số giây này, extension có thể xem response đã xong

Ví dụ:
- `2`: nhanh nhưng dễ cắt sớm
- `5`: cân bằng
- `8`: an toàn hơn với output dài

Khuyến nghị:
- dùng `5` cho mặc định

### 7.6. Retry Count

Ý nghĩa:
- số lần retry riêng cho stage nếu stage đó lỗi

Ví dụ:
- `0`: không retry stage
- `1`: retry 1 lần
- `2`: retry 2 lần

Khi nào nên tăng:
- stage đó hay lỗi do timeout
- stage đó phụ thuộc vào UI dễ fail ngẫu nhiên

### 7.7. Output Stage

Ngoài dropdown ở profile, bạn còn có radio `Output stage` ngay trên từng stage.

Ý nghĩa:
- chọn nhanh stage nào là output cuối

Quy tắc:
- chỉ nên có 1 output stage tại một thời điểm

---

## 8. Hướng dẫn tab Scripts

Tab `Scripts` dùng để chuẩn bị danh sách đầu vào.

### 8.1. Batch Name

Ý nghĩa:
- tên của đợt script hiện tại
- giúp bạn quản lý từng nhóm script

Ví dụ:
- `July SEO Batch`
- `Baseball Video Scripts`
- `Landing Page Rewrite Batch`

### 8.2. Add Script

Tạo thêm một script mới vào batch.

Khi tạo mới, script mặc định có:
- `id` kiểu `S001`, `S002`, ...
- `title` mặc định
- `content` rỗng
- `enabled = true`

### 8.3. Duplicate

Nhân bản script đang chọn.

Dùng khi:
- bạn muốn tạo biến thể từ một script có sẵn
- chỉ cần sửa nhẹ title hoặc content

Lưu ý:
- bản duplicate hiện có thể tạo ID kiểu `..._copy`
- nếu trùng ID, giao diện sẽ cảnh báo để bạn sửa

### 8.4. Delete

Xóa script đang chọn.

Nếu xóa hết, hệ thống sẽ tạo lại một script mặc định để batch không rỗng.

### 8.5. Up / Down

Đổi thứ tự script trong batch.

Ý nghĩa:
- thứ tự này sẽ là cơ sở để xử lý tuần tự sau này

Khuyến nghị:
- sắp theo thứ tự ưu tiên hoặc theo nhóm nội dung

### 8.6. Script ID

Ví dụ:
- `S001`
- `BLOG_01`
- `D507`

Ý nghĩa:
- mã định danh của script
- rất quan trọng khi export file hoặc đối chiếu kết quả

Khuyến nghị:
- mỗi script phải có ID duy nhất
- nên đặt theo mã công việc thực tế nếu có

### 8.7. Title

Ví dụ:
- `Video Script 01`
- `Blog Intro Draft`
- `D507 Baseball Story`

Ý nghĩa:
- tên hiển thị giúp nhận biết nhanh script

### 8.8. Availability

Giá trị:
- `Enabled`
- `Disabled`

Ý nghĩa:
- `Enabled`: script sẵn sàng để được chọn chạy
- `Disabled`: giữ lại trong batch nhưng tạm thời không muốn dùng

Khi nào dùng `Disabled`:
- script chưa hoàn thiện
- script đang lỗi nội dung
- script muốn giữ lại để tham khảo

### 8.9. Content

Ý nghĩa:
- nội dung đầu vào thực tế sẽ được đưa vào Gemini ở stage loại `script`

Ví dụ:

```text
Viết một kịch bản video YouTube dài 5 phút về lịch sử bóng chày, giọng kể hấp dẫn, mở đầu bằng hook mạnh.
```

Hoặc:

```text
Viết lại landing page dưới đây theo phong cách ngắn gọn, thuyết phục, tập trung vào lợi ích khách hàng.
```

### 8.10. Character Count

Ý nghĩa:
- số ký tự hiện tại của content
- giúp bạn ước lượng độ dài prompt

Khi nào hữu ích:
- khi cần kiểm soát prompt quá dài
- khi chia batch theo độ phức tạp

### 8.11. Autosave

Tab `Scripts` hiện tự động lưu sau khi bạn chỉnh sửa.

Ý nghĩa:
- không cần bấm nút Save thủ công
- giảm rủi ro mất dữ liệu khi reload

Trạng thái hiển thị:
- `idle`: chưa có hành động mới
- `saving`: đang lưu
- `saved`: vừa lưu xong

---

## 9. Luồng cấu hình gợi ý cho người mới

Nếu bạn mới dùng extension, hãy làm theo thứ tự này:

### Bước 1: Tạo Profile
- vào `Profiles`
- bấm `New Profile`
- nhập `Profile Name`
- nhập `Base URL`
- giữ `Enabled`

### Bước 2: Tạo Stage
- giữ 1 stage `script` làm input đầu vào
- thêm 1 hoặc 2 stage `fixed` nếu muốn refine kết quả
- chọn output stage cuối cùng

Ví dụ:
- Stage 1: `script`
- Stage 2: `fixed` = `Hãy viết lại nội dung trên theo phong cách chuyên nghiệp.`
- Stage 3: `fixed` = `Xuất kết quả cuối cùng ở dạng hoàn chỉnh, không giải thích thêm.`

### Bước 3: Cấu hình export
- chọn `per_script` nếu muốn mỗi script ra 1 file
- đặt `Filename Template` là `{{scriptId}}.txt`

### Bước 4: Tạo Script Batch
- vào `Scripts`
- đặt `Batch Name`
- thêm từng script
- nhập `Script ID`, `Title`, `Content`

### Bước 5: Kiểm tra lại dữ liệu
- đảm bảo không có `Script ID` trùng nhau
- đảm bảo profile có ít nhất 1 stage `script`
- đảm bảo stage `fixed` có nội dung
- đảm bảo `Output Stage` tồn tại

---

## 10. Các lỗi cấu hình thường gặp

### Base URL không hợp lệ
Nguyên nhân:
- không bắt đầu bằng `https://gemini.google.com/`

Cách sửa:
- dùng đúng URL Gemini hoặc URL Gem trong Gemini

### Không có stage `script`
Nguyên nhân:
- bạn xóa stage đầu vào script

Cách sửa:
- giữ ít nhất 1 stage có type là `script`

### Output stage không tồn tại
Nguyên nhân:
- bạn xóa stage đang được chọn làm output

Cách sửa:
- chọn lại một stage còn tồn tại

### Trùng Script ID
Nguyên nhân:
- hai script có cùng mã

Cách sửa:
- đổi một trong hai ID thành giá trị duy nhất

### Fixed stage để trống
Nguyên nhân:
- stage type là `fixed` nhưng chưa nhập prompt

Cách sửa:
- nhập nội dung cho `Stage Value`

---

## 11. Cấu trúc tài liệu liên quan

Nếu bạn muốn hiểu sâu hơn, xem thêm:
- [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md): tổng quan kiến trúc và phạm vi
- [FEATURE_USECASES.md](./FEATURE_USECASES.md): danh sách use case chi tiết
- [TASK_ROADMAP.md](./TASK_ROADMAP.md): roadmap triển khai theo phase

---

## 12. Trạng thái hiện tại của project

Đã có:
- nền tảng extension MV3
- Profile Management UI
- Script Batch UI
- validation cơ bản
- autosave batch script

Đang chờ phase tiếp theo:
- Run Configuration
- Job queue
- tab automation
- Gemini response detection
- export kết quả hoàn chỉnh
