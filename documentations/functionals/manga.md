## **Tài liệu Thiết kế: Phân hệ Quản lý Nội dung - Manga**

### **1. Tổng quan & Mục tiêu**

Xây dựng một hệ thống quản lý và phân phối nội dung Manga, kế thừa nền tảng vững chắc từ phân hệ Novel nhưng tập trung vào các thách thức và cơ hội đặc thù của nội dung hình ảnh. Mục tiêu chính là cung cấp một trải nghiệm đọc manga trực quan, mượt mà và tối ưu trên mọi thiết bị, đồng thời cung cấp bộ công cụ mạnh mẽ và mô hình kinh doanh linh hoạt cho các "Nhóm Sáng tạo".

### **2. Các Thực thể Cốt lõi (Core Entities)**

1.  **Manga (Tác phẩm):**
    *   Thực thể cha, đại diện cho một bộ truyện tranh.
    *   **Thuộc tính:** Tương tự Novel (Tên chính, Tác giả, Họa sĩ, Mô tả, Ảnh bìa, Trạng thái, v.v.).
    *   **Quan hệ:** Có nhiều **Tên gọi thay thế**, thuộc về nhiều **Thể loại**, chứa nhiều **Volume**.

2.  **Volume (Tập):**
    *   Một thư mục ảo để nhóm các Chapter. Đây là một cấu trúc linh hoạt.
    *   **Ghi chú triển khai:** Với các manga không có Volume chính thức (ví dụ: webtoon), hệ thống sẽ tự động tạo một **"Volume Mặc định"**. Giao diện sẽ ẩn đi phần chọn Volume nếu manga chỉ có một Volume duy nhất, đảm bảo trải nghiệm liền mạch.

3.  **Chapter (Chương):**
    *   Đại diện cho một chương truyện.
    *   **Quan hệ:** Thuộc về một **Volume** và chứa một danh sách các **Page**.

4.  **Page (Trang truyện):**
    *   Là đơn vị nội dung hình ảnh nhỏ nhất.
    *   **Thuộc tính:** Số thứ tự trang, URL hình ảnh.
    *   **Quan hệ:** Thuộc về một **Chapter** duy nhất.

### **3. Phân rã Chức năng Chi tiết**

#### **3.1. Mô hình Kinh doanh & Kiếm tiền (Monetization)**

Hệ thống kế thừa toàn bộ mô hình kinh doanh từ phân hệ Novel.

| Chức năng | Mô tả | Mức độ khả thi |
| :--- | :--- | :--- |
| **Truy cập Công khai (Public Access)** | Chapter được đọc miễn phí, có thể kèm quảng cáo. | **Rất khả thi** |
| **Mua lẻ Nội dung (Pay-per-Content)** | Dùng "tiền ảo" để mua quyền truy cập vĩnh viễn Chapter, Volume, hoặc toàn bộ Manga. | **Khả thi, phức tạp trung bình** |
| **Cho thuê Nội dung (Rental)** | Nhóm Sáng tạo bật tính năng cho thuê Volume/Manga đã hoàn thành với giá rẻ, có thời hạn. | **Rất khả thi, phức tạp trung bình** |
| **Đặc quyền Thuê bao (Subscription Perks)**| Cung cấp các quyền lợi như: Đọc trước (Early Access), Giảm giá khi mua/thuê, Loại bỏ quảng cáo. | **Rất khả thi** |
| **Ủng hộ/Donate** | Độc giả donate trực tiếp cho Nhóm Sáng tạo. | **Rất khả thi** |

#### **3.2. Trải nghiệm Người đọc & Tương tác Cộng đồng**

Đây là phần có sự khác biệt lớn nhất so với Novel.

| Chức năng | Mô tả | Mức độ khả thi |
| :--- | :--- | :--- |
| **Trình đọc Manga Chuyên dụng** | **Cốt lõi của phân hệ.** Cần có: <br>1. **Nhiều Chế độ đọc:** Cuộn Dọc (cho webtoon) và Lật Trang (cho manga truyền thống). <br>2. **Tối ưu hóa Hiệu năng:** Lazy-loading và pre-loading hình ảnh để đảm bảo tốc độ và sự mượt mà. <br>3. **Điều khiển Nâng cao:** Phóng to/thu nhỏ (zoom). | **Rất khả thi (Bắt buộc)** |
| **Bình luận theo Chapter** | Khu vực bình luận ở cuối mỗi chapter. | **Rất khả thi** |
| **Đánh giá & Review** | Xếp hạng sao và viết bài đánh giá chi tiết cho Manga. | **Rất khả thi** |
| **Yêu thích/Theo dõi** | Theo dõi Manga để nhận thông báo và cập nhật. | **Rất khả thi** |

#### **3.3. Công cụ dành cho "Nhóm Sáng tạo"**

Tập trung vào việc đơn giản hóa quy trình làm việc với hình ảnh.

| Chức năng | Mô tả | Mức độ khả thi |
| :--- | :--- | :--- |
| **Trang quản lý Nội dung** | Giao diện để thêm/sửa/xóa Manga, Volume, Chapter. Thiết lập giá và mô hình truy cập. | **Rất khả thi (Bắt buộc)** |
| **Quản lý & Tối ưu hóa Hình ảnh** | - **Uploader thông minh:** Hỗ trợ tải lên nhiều ảnh cùng lúc, kéo-thả để sắp xếp thứ tự trang. <br>- **Xử lý tự động:** Tự động nén ảnh và chuyển đổi sang định dạng WebP để tối ưu tốc độ tải và chi phí lưu trữ. | **Rất khả thi (Bắt buộc)** |
| **Bảng điều khiển Phân tích** | Cung cấp số liệu thống kê về lượt đọc, doanh thu, v.v. | **Khả thi, phức tạp trung bình** |
| **Đóng góp Bản dịch (Scanlation)** | (**Đề xuất cho tương lai**) Không cung cấp công cụ chỉnh sửa ảnh online. Thay vào đó, xây dựng một hệ thống quản lý quy trình, nơi Nhóm Sáng tạo có thể kết nối và quản lý các cộng tác viên (Translator, Cleaner, Typesetter). Cộng tác viên sẽ làm việc offline và tải lên bộ ảnh đã hoàn thiện để được phê duyệt. | **Khả thi, phức tạp trung bình** |

### **4. Logic Kiểm tra Quyền Truy cập (Authorization Flow)**

Luồng kiểm tra quyền truy cập một Chapter Manga hoàn toàn **giống hệt** phân hệ Novel, chứng tỏ sự vững chắc của thiết kế logic kinh doanh.

1.  Chapter có phải là **Public** không?
2.  Người dùng có phải là **Admin/Moderator** không?
3.  Người dùng có đang trong thời gian **Early Access** không?
4.  Người dùng đã **Mua** nội dung này chưa?
5.  Người dùng có đang trong thời gian **Thuê** nội dung này không?
6.  Nếu không có quyền nào ở trên -> Trả về lỗi `403 Forbidden`.

### **5. Đề xuất Lộ trình Phát triển (Roadmap)**

*   **Giai đoạn 1 (MVP - Sản phẩm khả dụng tối thiểu):**
    *   **Ưu tiên hàng đầu:** Xây dựng **Trình đọc Manga Chuyên dụng** và **Hệ thống Quản lý & Tối ưu hóa Hình ảnh**.
    *   Hệ thống quản lý Manga/Volume/Chapter cơ bản.
    *   Monetization: **Public** và **Mua lẻ Nội dung**.
    *   Cộng đồng: **Bình luận theo Chapter**, **Yêu thích/Theo dõi**.

*   **Giai đoạn 2 (Nâng cao & Mở rộng):**
    *   Monetization: Triển khai **Cho thuê Nội dung** và **Đặc quyền Thuê bao**.
    *   Công cụ cho Creator: Xây dựng **Bảng điều khiển Phân tích**.
    *   Trải nghiệm đọc: Bổ sung các tính năng điều khiển nâng cao.

*   **Giai đoạn 3 (Tầm nhìn Dài hạn):**
    *   Triển khai hệ thống quản lý quy trình **Đóng góp Bản dịch**.
    *   Các tính năng cộng đồng cao cấp như **Tặng Quà**.