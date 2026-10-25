# Đặc tả chức năng

## 1. Xác thực, hồ sơ và phân quyền

### Chức năng

- Đăng ký, xác minh email, đăng nhập, đăng xuất, quên/đổi mật khẩu.
- Onboarding theo mục đích giáo viên/học sinh.
- Hồ sơ: họ tên, avatar, trường, tỉnh/thành, ngày sinh tùy chọn.
- Trang quản lý phiên và tùy chọn nhận thông báo email.
- Route protection ở server; quyền dữ liệu luôn kiểm tra thêm bằng RLS.

### Tiêu chí nghiệm thu

- Email chưa xác minh không thể tạo hoặc tham gia lớp.
- Người chưa đăng nhập bị chuyển về trang đăng nhập và quay lại đúng URL sau khi đăng nhập.
- Người dùng không thể tự sửa `platform_role`, `auth_user_id` hoặc quyền lớp.
- Đổi mật khẩu thành công có thông báo rõ ràng; link hết hạn có cách gửi lại.

## 2. Lớp học

### 2.1 Danh sách và tổng quan lớp

- Tab lớp đang hoạt động/đã lưu trữ.
- Tìm theo tên, lọc môn và vai trò.
- Thẻ lớp hiển thị tên, môn, giáo viên, số việc cần làm và lịch gần nhất.
- Trang tổng quan lớp gom thông báo ghim, lịch gần nhất, bài sắp hạn và nội dung mới.

### 2.2 Bảng tin

- Chủ lớp/giáo viên/trợ giảng theo quyền được tạo bài đăng.
- Bài đăng gồm văn bản rich text giới hạn, tối đa 10 tệp/link đính kèm.
- Chọn đối tượng: cả lớp hoặc một/nhiều nhóm.
- Nháp, xuất bản ngay, hẹn giờ, ghim, chỉnh sửa, lưu trữ.
- Bình luận một cấp; chủ bài và giáo viên có thể xóa/khóa bình luận.
- Học sinh chỉ thấy bài được nhắm tới mình/nhóm mình.

Tiêu chí nghiệm thu:

- Bài hẹn giờ không hiển thị trước `publish_at`.
- Khi sửa bài đã đăng, giao diện hiển thị trạng thái “đã chỉnh sửa”.
- Thành viên ngoài nhóm không lấy được bài đăng qua API trực tiếp.

### 2.3 Lịch học

- Tạo buổi học một lần hoặc lặp theo tuần trong một khoảng ngày.
- Trường dữ liệu: tiêu đề, bắt đầu/kết thúc, địa điểm, link học, mô tả, nhóm tham dự.
- Chế độ tháng/tuần/danh sách; lọc theo lớp.
- Sửa một buổi hoặc toàn bộ chuỗi; hủy buổi nhưng giữ lịch sử.
- Nhắc trước 24 giờ và 15 phút (có thể tắt theo người dùng).
- P1: điểm danh gắn với từng buổi.

Tiêu chí nghiệm thu:

- Không cho thời gian kết thúc nhỏ hơn/bằng bắt đầu.
- Mọi thời gian hiển thị đúng múi giờ lớp.
- Người dùng chỉ nhận nhắc lịch thuộc lớp/nhóm của mình.

### 2.4 Thành viên

- Mời/tham gia bằng mã hoặc link; bật/tắt yêu cầu phê duyệt.
- Danh sách theo vai trò và trạng thái; tìm kiếm, lọc, chọn nhiều.
- Duyệt/từ chối hàng loạt; xóa học sinh; tạo lại mã lớp.
- Import học sinh bằng CSV ở P1; không tự tạo mật khẩu yếu cho người dùng.

Tiêu chí nghiệm thu:

- Một tài khoản chỉ có một membership trong một lớp.
- Học sinh `pending` không đọc được nội dung lớp.
- Mã lớp không xuất hiện trong log phân tích hoặc URL công khai.

### 2.5 Vai trò trong lớp

- Owner: toàn quyền và chuyển quyền sở hữu.
- Teacher: quản lý dạy học, thành viên học sinh và điểm.
- Teaching assistant: quyền theo capability do owner bật.
- Student: học, nộp bài, xem dữ liệu của mình.
- Hỗ trợ capability cho trợ giảng: `manage_content`, `manage_assignments`, `grade_submissions`, `manage_members`, `manage_schedule`.

### 2.6 Nhóm học tập

- Tạo/sửa/xóa mềm nhóm; màu, mô tả, trưởng nhóm tùy chọn.
- Thêm/bớt thành viên thủ công; một học sinh có thể thuộc nhiều nhóm.
- Giao bài đăng, lịch, bài giảng, tài liệu và bài tập cho nhóm.
- Hiển thị cảnh báo trước khi xóa nhóm đang là đối tượng của nội dung.

Tiêu chí nghiệm thu:

- Xóa nhóm không xóa nội dung/bài nộp lịch sử.
- Khi học sinh bị bỏ khỏi nhóm, quyền xem nội dung tương lai mất ngay; bài đã nộp vẫn được giữ.

### 2.7 Cài đặt lớp

- Thông tin lớp, ảnh bìa, môn, khối, năm học, múi giờ.
- Quy tắc tham gia, bật bình luận, hiển thị danh sách thành viên.
- Chính sách mặc định về nộp muộn và hiển thị đáp án.
- Lưu trữ/khôi phục lớp, chuyển owner, yêu cầu xóa lớp.

## 3. Bài giảng

- Bài giảng là đơn vị nội dung có tiêu đề, mô tả, nội dung rich text, video URL và tệp.
- Sắp xếp bài giảng theo chủ đề/chương và thứ tự kéo-thả.
- Nháp/hẹn giờ/xuất bản; giao cho lớp hoặc nhóm.
- Đính kèm tài liệu từ kho học liệu mà không nhân bản file.
- Theo dõi trạng thái `not_started`, `in_progress`, `completed`; học sinh tự đánh dấu hoàn thành ở P0.
- P1: điều kiện hoàn thành theo xem video/tài liệu hoặc làm bài liên quan.

Tiêu chí nghiệm thu:

- Học sinh không thấy bài nháp hoặc bài không giao cho mình.
- Giáo viên xem được tỷ lệ hoàn thành và danh sách chưa hoàn thành.
- Xóa liên kết bài giảng không xóa tài liệu gốc trong kho.

## 4. Tài liệu trong lớp

- Upload PDF, DOCX, PPTX, XLSX, ảnh, audio/video dung lượng trong quota.
- Thêm link ngoài; mô tả, thẻ, thư mục và đối tượng lớp/nhóm.
- Xem trước PDF/ảnh/video khi trình duyệt hỗ trợ; loại khác tải xuống.
- Phiên bản tệp đơn giản: thay file mới nhưng giữ lịch sử metadata (P1).
- Tài liệu lớp có thể tham chiếu tới tài nguyên trong kho học liệu.

Tiêu chí nghiệm thu:

- Kiểm tra MIME thực tế và phần mở rộng; không tin tên file từ client.
- File riêng tư dùng signed URL ngắn hạn.
- Xóa tài liệu đang được bài giảng/bài tập dùng phải cảnh báo các tham chiếu.

## 5. Bài tập và kiểm tra

### 5.1 Tạo bài

- Loại: bài nộp tệp, tự luận, trắc nghiệm hoặc hỗn hợp.
- Trường chung: tiêu đề, hướng dẫn, tệp đề, đối tượng, mở từ, hạn nộp, đóng lúc, thang điểm.
- Cấu hình: cho nộp muộn, số lượt làm, thời lượng, trộn câu, trộn đáp án, hiển thị kết quả/đáp án.
- Câu hỏi P0: một lựa chọn, nhiều lựa chọn, đúng/sai, trả lời ngắn, tự luận.
- Câu hỏi có điểm, lời giải và tệp/ảnh đính kèm.
- Lưu nháp tự động; preview đúng giao diện học sinh trước khi xuất bản.

### 5.2 Làm và nộp bài

- Học sinh thấy thời gian còn lại và trạng thái lưu nháp.
- Đáp án trắc nghiệm lưu từng câu; tệp được upload trước rồi mới xác nhận nộp.
- Nộp tạo biên nhận gồm thời gian server, lượt nộp và checksum/metadata tệp.
- Cho nộp lại nếu cấu hình cho phép; giáo viên xem lịch sử các lượt.
- Khi hết giờ, hệ thống nộp phần đã lưu nếu bài có thời lượng; giao diện cảnh báo trước.

### 5.3 Chấm bài

- Tự chấm câu có đáp án xác định.
- Giáo viên chấm tự luận/tệp, nhập điểm và nhận xét từng câu/toàn bài.
- Điểm tổng tính server-side, không nhận tổng điểm do client gửi.
- Điểm nháp, trả bài riêng lẻ hoặc hàng loạt.
- Cho phép chấm lại và lưu lịch sử ai sửa, lúc nào, từ bao nhiêu sang bao nhiêu.

### 5.4 Chính sách hiển thị

- `immediate`: thấy điểm tự động sau nộp.
- `after_due`: thấy sau hạn.
- `after_publish`: chỉ thấy khi giáo viên trả bài.
- Đáp án đúng/lời giải có cấu hình riêng, mặc định chỉ sau khi đóng bài.

Tiêu chí nghiệm thu:

- Học sinh không thể lấy đáp án qua payload/API trước thời điểm cho phép.
- Bài quá hạn được gắn `late` bằng thời gian server.
- Một lỗi mạng không tạo hai lượt nộp nhờ idempotency key.
- Tổng điểm và trạng thái chấm nhất quán khi giáo viên sửa đáp án.

## 6. Bảng điểm

- Bảng ma trận học sinh × cột điểm; cột gắn bài tập hoặc nhập tay.
- Nhóm cột theo danh mục: thường xuyên, giữa kỳ, cuối kỳ, khác.
- Điểm số, miễn chấm (`excused`), chưa có điểm và vắng được phân biệt.
- Công thức P0: tổng có trọng số theo cột; P1 thêm trọng số theo danh mục.
- Giáo viên ẩn/hiện từng cột cho học sinh.
- Trang chi tiết học sinh: lịch sử nộp, điểm, nhận xét và tiến độ.
- P1: xuất CSV/XLSX; không import ghi đè trước khi preview thay đổi.

Tiêu chí nghiệm thu:

- Học sinh chỉ xem điểm của bản thân.
- Cột điểm nháp không tham gia điểm hiển thị cho học sinh.
- Mọi chỉnh sửa điểm thủ công có audit log.
- Làm tròn chỉ ở lớp hiển thị; dữ liệu gốc giữ đủ độ chính xác.

## 7. Kho học liệu

### 7.1 Cấu trúc

```text
Cấp học
└── Khối/Lớp
    └── Môn học
        └── Thư mục nhiều cấp
            └── Tài nguyên
```

- Cấp/khối/môn do admin nền tảng quản lý để tránh dữ liệu trùng.
- Trong mỗi môn, giáo viên tạo cây thư mục riêng hoặc dùng thư mục chia sẻ.
- Tài nguyên gồm file, link, video URL hoặc nội dung văn bản.

### 7.2 Metadata và tìm kiếm

- Tiêu đề, mô tả, cấp, khối, môn, thư mục, tác giả, thẻ, loại file, dung lượng.
- Phạm vi: `private`, `class`, `platform` (P1 cần duyệt trước khi công khai).
- Tìm theo từ khóa; lọc cấp/khối/môn/loại file/thẻ/người tạo.
- Sắp xếp mới nhất, tên, được dùng nhiều.

### 7.3 Tái sử dụng

- Gắn một tài nguyên vào nhiều lớp/bài giảng/bài tập bằng tham chiếu.
- “Tạo bản sao” khi giáo viên cần chỉnh nội dung độc lập.
- Theo dõi nơi tài nguyên đang được dùng trước khi xóa.
- Soft delete; tài nguyên còn tham chiếu không bị xóa file vật lý.

Tiêu chí nghiệm thu:

- Không tạo vòng lặp trong cây thư mục.
- Giáo viên không thể đưa file của người khác từ `private` vào lớp.
- Đổi tên/di chuyển thư mục không làm hỏng liên kết tài nguyên.
- Xóa file vật lý chỉ khi không còn phiên bản/tham chiếu hợp lệ.

## 8. Thông báo

- Trung tâm thông báo trong web: chưa đọc/đã đọc, lọc theo lớp.
- Sự kiện P0: được duyệt vào lớp, bài/lịch/nội dung mới, đổi hạn, sắp đến hạn, bài được trả, nhận xét mới.
- Email cho sự kiện quan trọng; gom nhắc hạn để tránh spam.
- Deep link đưa người dùng tới đúng lớp/đối tượng và vẫn kiểm tra quyền.
- P1: tùy chỉnh theo loại sự kiện và bản tin hằng ngày.

## 9. Chức năng bổ sung nên có

### P1 ưu tiên cao

- Ngân hàng câu hỏi cá nhân/theo môn: tái sử dụng, gắn thẻ, mức độ, import CSV.
- Điểm danh: có mặt, muộn, vắng có phép, vắng; thống kê theo học sinh.
- Phân tích học tập: tỷ lệ nộp, phân bố điểm, câu sai nhiều, danh sách cần hỗ trợ.
- Sao chép lớp/nội dung để giáo viên tái sử dụng giữa học kỳ.
- Xuất dữ liệu bảng điểm và danh sách thành viên.

### Chỉ cân nhắc sau P1

- Diễn đàn hỏi đáp theo bài giảng (không phải chat cá nhân).
- Rubric và nhận xét mẫu để chấm nhanh.
- Điều kiện mở khóa bài tiếp theo.
- Liên kết lịch ngoài và meeting link; không tự xây video call.
