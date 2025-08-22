## **Tài liệu Thiết kế: Phân hệ Quản lý Nội dung - Novel**

### **1. Tổng quan & Mục tiêu**

Xây dựng một hệ thống quản lý và phân phối nội dung Novel toàn diện, linh hoạt. Hệ thống không chỉ cung cấp một trải nghiệm đọc tuyệt vời mà còn tích hợp nhiều mô hình kinh doanh đa dạng (mua lẻ, cho thuê, thuê bao) để tối đa hóa doanh thu cho "Nhóm Sáng tạo" và nền tảng. Mục tiêu là tạo ra một hệ sinh thái sôi động, thu hút cả độc giả và nhà sáng tạo nội dung.

### **2. Các Thực thể Cốt lõi (Core Entities)**

1.  **Novel (Tác phẩm):**
    *   Là thực thể cha, đại diện cho một bộ truyện hoàn chỉnh.
    *   **Thuộc tính:** Tên chính, Tác giả, Họa sĩ minh họa, Mô tả, Ảnh bìa, Trạng thái (đang tiến hành, đã hoàn thành, tạm ngưng), Nhóm Sáng tạo sở hữu.
    *   **Quan hệ:**
        *   Có thể có nhiều **Tên gọi thay thế** (Alias).
        *   Thuộc về nhiều **Thể loại** (Genre/Tag).
        *   Chứa nhiều **Volume**.

2.  **Volume (Tập):**
    *   Đại diện cho một tập truyện, dùng để nhóm các Chapter lại.
    *   **Thuộc tính:** Tên Volume (ví dụ: "Tập 1"), Ảnh bìa Volume, Mô tả ngắn.
    *   **Quan hệ:** Thuộc về một **Novel** duy nhất và chứa nhiều **Chapter**.

3.  **Chapter (Chương):**
    *   Là đơn vị nội dung nhỏ nhất mà người dùng sẽ đọc.
    *   **Thuộc tính:** Tên Chapter, Số thứ tự, Nội dung (chủ yếu là text), Thời gian xuất bản.
    *   **Quan hệ:** Thuộc về một **Volume** duy nhất.

### **3. Phân rã Chức năng Chi tiết**

#### **3.1. Mô hình Kinh doanh & Kiếm tiền (Monetization)**

Hệ thống sẽ hỗ trợ song song nhiều mô hình để tạo sự linh hoạt tối đa.

| Chức năng | Mô tả | Mức độ khả thi |
| :--- | :--- | :--- |
| **Truy cập Công khai (Public Access)** | Chapter được đọc miễn phí, có thể kèm quảng cáo. | **Rất khả thi** |
| **Mua lẻ Nội dung (Pay-per-Content)** | Người dùng dùng "tiền ảo" (Coin) để mua quyền truy cập vĩnh viễn: Mua lẻ **Chapter**, Mua theo **Volume** (giá ưu đãi), Mua trọn bộ **Novel**. | **Khả thi, phức tạp trung bình** |
| **Cho thuê Nội dung (Rental)** | Nhóm Sáng tạo có thể bật tính năng cho thuê **Volume/Novel** đã hoàn thành với giá rẻ hơn, có thời hạn truy cập (ví dụ: 7 ngày cho Volume, 30 ngày cho Novel). | **Rất khả thi, phức tạp trung bình** |
| **Đặc quyền Thuê bao (Subscription Perks)** | Gói thuê bao (Premium/VIP) **KHÔNG** mở khóa nội dung trả phí, nhưng cung cấp các quyền lợi như: Đọc trước (Early Access), Giảm giá khi mua/thuê, Loại bỏ quảng cáo. | **Rất khả thi** |
| **Vé Đọc Hàng Ngày (Daily Pass)** | (Tùy chọn) Với các truyện đã hoàn thành, người dùng nhận 1 vé/ngày để mở khóa 1 chapter miễn phí. Muốn đọc nhanh hơn phải trả tiền. Giúp giữ chân người dùng miễn phí. | **Khả thi, phức tạp trung bình** |
| **Ủng hộ/Donate** | Người đọc có thể donate trực tiếp cho Nhóm Sáng tạo để thể hiện sự yêu mến. | **Rất khả thi** |

#### **3.2. Trải nghiệm Người đọc & Tương tác Cộng đồng**

| Chức năng | Mô tả | Mức độ khả thi |
| :--- | :--- | :--- |
| **Trình đọc Tùy chỉnh** | Cho phép người dùng thay đổi: font chữ, kích thước chữ, màu nền (sáng/tối/sepia), giãn cách dòng. | **Rất khả thi** |
| **Đồng bộ Tiến trình** | Tự động lưu và đồng bộ vị trí đọc (chapter, đoạn văn) trên các thiết bị. | **Rất khả thi** |
| **Bình luận** | - **Theo Chapter:** Khu vực bình luận ở cuối mỗi chapter. <br>- **Theo Đoạn văn (Tương lai):** Cho phép bình luận trên từng đoạn văn cụ thể. | **Rất khả thi** |
| **Đánh giá & Review** | Người dùng có thể xếp hạng sao (1-5) và viết bài đánh giá chi tiết cho Novel. | **Rất khả thi** |
| **Yêu thích/Theo dõi** | Người dùng theo dõi Novel để nhận thông báo chương mới và giúp tăng độ phổ biến của truyện. | **Rất khả thi** |
| **Nghe Audio (Text-to-Speech)** | (Tương lai) Tích hợp tính năng chuyển văn bản thành giọng nói. | **Khả thi, phức tạp trung bình** |
| **Tặng Quà (Gifting)** | (Tương lai) Người dùng có thể mua và tặng Chapter/Volume cho bạn bè. | **Khả thi, phức tạp trung bình** |

#### **3.3. Công cụ dành cho "Nhóm Sáng tạo"**

| Chức năng | Mô tả | Mức độ khả thi |
| :--- | :--- | :--- |
| **Trang quản lý Nội dung** | Giao diện để thêm/sửa/xóa Novel, Volume, Chapter. Thiết lập giá, mô hình truy cập (công khai, trả phí, cho thuê) cho từng nội dung. | **Rất khả thi (Bắt buộc)** |
| **Bảng điều khiển Phân tích** | Cung cấp số liệu thống kê về lượt đọc, doanh thu, nhân khẩu học độc giả. | **Khả thi, phức tạp trung bình** |
| **Quản lý Đóng góp Dịch thuật** | (Tương lai) Bật/tắt tính năng cho phép cộng đồng đóng góp bản dịch. Cung cấp giao diện để duyệt và phê duyệt các bản dịch. | **Khả thi, phức tạp cao** |

### **4. Logic Kiểm tra Quyền Truy cập (Authorization Flow)**

Khi một người dùng yêu cầu đọc một **Chapter**, API backend sẽ kiểm tra theo thứ tự ưu tiên sau:

1.  **Chapter có phải là Public không?**
    *   Nếu có -> Cho phép truy cập.
2.  **Người dùng có phải là Admin/Moderator không?**
    *   Nếu có -> Cho phép truy cập.
3.  **Người dùng có đang trong thời gian Early Access của gói thuê bao không?** (Đối với chapter mới ra mắt)
    *   Nếu có -> Cho phép truy cập.
4.  **Người dùng đã mua Chapter/Volume/Novel này chưa?**
    *   Nếu có (kiểm tra trong bảng `user_content_purchases`) -> Cho phép truy cập.
5.  **Người dùng có đang trong thời gian thuê Volume/Novel này không?**
    *   Nếu có (kiểm tra trong bảng `user_content_rentals` và `expiry_date`) -> Cho phép truy cập.
6.  **Người dùng có "Vé đọc hàng ngày" và Chapter này đủ điều kiện không?**
    *   Nếu có -> Cho phép truy cập và trừ vé.
7.  **Nếu tất cả các điều trên đều không đúng -> Trả về lỗi `403 Forbidden`** và yêu cầu người dùng thực hiện hành động (mua, thuê, nâng cấp).

### **5. Đề xuất Lộ trình Phát triển (Roadmap)**

*   **Giai đoạn 1 (MVP - Sản phẩm khả dụng tối thiểu):**
    *   Hệ thống quản lý Novel/Volume/Chapter cơ bản.
    *   Monetization: **Public** và **Mua lẻ Nội dung**.
    *   Cộng đồng: **Bình luận theo Chapter**, **Yêu thích/Theo dõi**, **Đánh giá & Review**.
    *   Trải nghiệm đọc: **Trình đọc tùy chỉnh** cơ bản.

*   **Giai đoạn 2 (Nâng cao & Mở rộng):**
    *   Monetization: Triển khai **Cho thuê Nội dung** và **Đặc quyền Thuê bao**.
    *   Công cụ cho Creator: Xây dựng **Bảng điều khiển Phân tích**.
    *   Trải nghiệm đọc: **Đồng bộ Tiến trình**.

*   **Giai đoạn 3 (Tầm nhìn Dài hạn):**
    *   Triển khai hệ thống **Đóng góp Bản dịch**.
    *   Monetization: Mô hình **Vé Đọc Hàng Ngày**.
    *   Cộng đồng: **Bình luận theo Đoạn văn**, **Tặng Quà**.
    *   Trải nghiệm đọc: Tích hợp **Text-to-Speech**.