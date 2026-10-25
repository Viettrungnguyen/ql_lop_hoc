# Kế hoạch sản phẩm LMS phục vụ giảng dạy

## 1. Mục tiêu

Xây dựng một web LMS lấy cảm hứng từ luồng sử dụng của SHub Classroom, tập trung vào ba việc cốt lõi:

1. Giáo viên tổ chức lớp, giao nội dung, giao bài và đánh giá.
2. Học sinh theo dõi lịch/nhiệm vụ, học tài liệu, làm bài và xem phản hồi.
3. Hệ thống tổng hợp tiến độ, điểm số và nhắc các việc cần làm.

Sản phẩm là một triển khai độc lập. Không sao chép tên thương hiệu, logo, hình ảnh, nội dung có bản quyền hoặc mã nguồn của SHub.

## 2. Nguyên tắc phạm vi

- Teacher-first: thao tác hằng ngày của giáo viên phải nhanh và rõ.
- Học tập là trung tâm: chỉ làm tính năng hỗ trợ tổ chức, dạy, học và đánh giá.
- Web responsive trước; chưa làm ứng dụng mobile native.
- Lớp học là ranh giới dữ liệu chính; mọi dữ liệu riêng tư phải được bảo vệ bằng Supabase RLS.
- Tệp lưu ở Supabase Storage, dữ liệu nghiệp vụ ở PostgreSQL, giao diện/API deploy trên Vercel.
- Không thực hiện test local theo yêu cầu. Quy trình kiểm tra được thiết kế trên môi trường Vercel/Supabase thật và có biện pháp giảm rủi ro.

## 3. Phạm vi phiên bản đầu

### P0 — bắt buộc để phát hành

- Đăng ký, đăng nhập, quên mật khẩu, hồ sơ và phân quyền.
- Tạo lớp, tham gia bằng mã, duyệt thành viên và quản lý vai trò.
- Bảng tin, lịch học, nhóm học tập và cài đặt lớp.
- Bài giảng, tài liệu lớp và kho học liệu theo Cấp học → Khối/Lớp → Môn → Thư mục.
- Bài tập tự luận, nộp tệp; bài trắc nghiệm một lựa chọn/nhiều lựa chọn.
- Chấm tự động phần trắc nghiệm, chấm tay phần tự luận/tệp.
- Bảng điểm và xem chi tiết kết quả.
- Thông báo trong ứng dụng và email cho sự kiện quan trọng.
- Nhật ký thao tác cơ bản, RLS, giới hạn tệp và quy trình deploy.

### P1 — cần thiết ngay sau khi P0 ổn định

- Ngân hàng câu hỏi, trộn câu/trộn đáp án, nhập câu hỏi bằng CSV.
- Điểm danh theo buổi học.
- Thống kê tiến độ lớp, câu hỏi sai nhiều, học sinh có nguy cơ trễ bài.
- Nhận xét theo bài/câu, trả bài hàng loạt, xuất bảng điểm CSV/XLSX.
- Sao chép bài tập, bài giảng và cấu trúc lớp.

### P2 — để sau

- Rubric nâng cao, chấm chéo, lộ trình học có điều kiện.
- Tích hợp Zoom/Google Meet bằng liên kết và đồng bộ lịch ngoài.
- Quản trị cấp trường/trung tâm, phụ huynh, SSO tổ chức.
- AI sinh câu hỏi/gợi ý nội dung sau khi dữ liệu và quy trình cốt lõi ổn định.

### Không làm trong phạm vi hiện tại

- Mạng xã hội công khai, marketplace/gia sư, thanh toán, quảng cáo.
- Chat cá nhân thời gian thực, livestream/video conference tự xây.
- Gamification, bảng xếp hạng công khai, hệ thống điểm thưởng.
- Ứng dụng iOS/Android native.

## 4. Chân dung người dùng

| Người dùng | Nhu cầu chính |
|---|---|
| Học sinh | Xem việc cần làm, học nội dung, nộp bài, xem điểm và phản hồi |
| Giáo viên | Quản lý lớp, nội dung, bài tập, tiến độ, điểm và phản hồi |
| Trợ giảng | Hỗ trợ nội dung/chấm bài theo quyền được cấp |
| Chủ lớp | Toàn quyền trong một lớp, phân vai và cấu hình lớp |
| Quản trị nền tảng | Xử lý vận hành, taxonomy học liệu, khóa nội dung/tài khoản vi phạm |

## 5. Tài liệu trong thư mục

- [01-pham-vi-va-luong-nghiep-vu.md](./01-pham-vi-va-luong-nghiep-vu.md): luồng người dùng và quy tắc nghiệp vụ.
- [02-dac-ta-chuc-nang.md](./02-dac-ta-chuc-nang.md): đặc tả chi tiết từng chức năng và tiêu chí nghiệm thu.
- [03-vai-tro-va-phan-quyen.md](./03-vai-tro-va-phan-quyen.md): vai trò, ma trận quyền và nguyên tắc RLS.
- [04-mo-hinh-du-lieu.md](./04-mo-hinh-du-lieu.md): mô hình bảng, quan hệ, trạng thái và Storage.
- [05-kien-truc-ky-thuat.md](./05-kien-truc-ky-thuat.md): kiến trúc Next.js, Supabase, Vercel và bảo mật.
- [06-roadmap-va-backlog.md](./06-roadmap-va-backlog.md): giai đoạn triển khai, phụ thuộc và Definition of Done.
- [07-deploy-va-kiem-tra-prod.md](./07-deploy-va-kiem-tra-prod.md): deploy và checklist kiểm tra trên production.
- [08-quyet-dinh-san-pham.md](./08-quyet-dinh-san-pham.md): các quyết định mặc định, rủi ro và câu hỏi cần chốt.
- [09-tien-do-trien-khai.md](./09-tien-do-trien-khai.md): trạng thái thực hiện thực tế theo từng giai đoạn.

## 6. Chỉ số thành công ban đầu

- Giáo viên tạo lớp và mời học sinh trong dưới 3 phút.
- Giáo viên tạo một bài tập cơ bản trong dưới 5 phút.
- Học sinh nhìn thấy bài sắp đến hạn ngay khi vào hệ thống.
- 100% truy vấn dữ liệu lớp chịu kiểm soát bằng RLS, không chỉ bằng giao diện.
- Không có tệp bài nộp/tài liệu riêng tư truy cập được qua URL công khai vĩnh viễn.
- Các tác vụ cốt lõi dùng tốt trên desktop và màn hình điện thoại.

## 7. Cơ sở tham khảo

Kế hoạch tham khảo nhóm chức năng công khai của [SHub Classroom](https://shub.edu.vn/) tại ngày 25/10/2026: tài nguyên, học liệu, bài tập, thi trực tuyến, lịch dạy, bảng điểm, nhóm học tập, bảng tin và phân vai trò. Phạm vi trong tài liệu đã được tinh gọn cho mục tiêu giảng dạy của dự án này.
