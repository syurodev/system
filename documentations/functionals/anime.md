## **Tài liệu Thiết kế: Phân hệ Quản lý Nội dung - Anime**

### **1. Tổng quan & Mục tiêu**

Xây dựng một phân hệ Anime toàn diện, không chỉ là nơi để xem phim mà còn là một trung tâm cộng đồng và một công cụ quản lý sở thích cá nhân mạnh mẽ. Phân hệ này sẽ kết hợp trải nghiệm xem video chất lượng cao với các tính năng xã hội đột phá và công cụ khám phá nội dung chuyên sâu, nhằm tạo ra một điểm đến cuối cùng cho người hâm mộ anime.

### **2. Các Thực thể Cốt lõi (Core Entities)**

*   **Anime (Tác phẩm):** Thực thể cha, chứa thông tin tổng quan.
    *   **Thuộc tính:** Tên chính, Tên thay thế, Thể loại, Mô tả, Ảnh bìa, Trạng thái.
    *   **Metadata Mở rộng:** **Mùa phát sóng** (Xuân/Hạ/Thu/Đông), **Năm phát sóng**, **Studio sản xuất**.
*   **Season (Mùa Anime):** Nhóm các tập phim lại (ví dụ: Season 1, Season 2).
*   **Episode (Tập phim):** Đơn vị nội dung chính, chứa video và phụ đề.
*   **Character (Nhân vật):** Thực thể chứa thông tin về các nhân vật trong anime.
*   **Seiyuu (Diễn viên lồng tiếng):** Thực thể chứa thông tin về diễn viên.
    *   **Quan hệ:** Một `Character` được lồng tiếng bởi một `Seiyuu` trong một `Anime`. Một `Seiyuu` có thể lồng tiếng cho nhiều `Character`.

### **3. Phân rã Chức năng Chi tiết**

#### **3.1. Khám phá & Quản lý Nội dung**

| Chức năng | Mô tả | Mức độ khả thi |
| :--- | :--- | :--- |
| **Duyệt theo Mùa phát sóng** | Trang riêng để khám phá anime theo từng mùa (`/seasonal/fall-2025`). | **Rất khả thi** |
| **Lịch phát sóng** | Trang hiển thị lịch ra mắt tập mới của các anime đang chiếu theo từng ngày trong tuần. | **Rất khả thi** |
| **Cơ sở dữ liệu Nhân vật & Seiyuu** | Phân hệ Anime sẽ tích hợp và sử dụng Hệ thống Quản lý Nhân vật trung tâm của nền tảng. Hệ thống này cho phép một nhân vật có thể được liên kết đồng thời với nhiều phiên bản nội dung khác nhau (anime, manga, novel), tạo ra một trải nghiệm khám phá liền mạch. | **Khả thi, phức tạp trung bình** |
| **Phân loại theo Studio** | Cho phép người dùng xem tất cả anime do một studio cụ thể sản xuất. | **Rất khả thi** |

#### **3.2. Trải nghiệm Xem & Tương tác**

| Chức năng | Mô tả | Mức độ khả thi |
| :--- | :--- | :--- |
| **Trình phát Video Hiện đại** | Tích hợp trình phát video mạnh mẽ, hỗ trợ các tính năng bên dưới. | **Rất khả thi (Bắt buộc)** |
| **Chọn Chất lượng Video** | Cho phép người dùng chủ động chọn độ phân giải (360p, 720p, 1080p+). | **Rất khả thi (Bắt buộc)** |
| **Nút "Bỏ qua Intro"** | Nút bấm tiện lợi để bỏ qua đoạn nhạc mở đầu của mỗi tập. | **Khả thi, phức tạp trung bình** |
| **Tùy chỉnh Phụ đề** | Cho phép người dùng chọn ngôn ngữ, thay đổi font, kích thước, màu sắc của phụ đề. | **Rất khả thi** |
| **Bình luận theo Episode** | Khu vực thảo luận sôi nổi dưới mỗi tập phim. | **Rất khả thi** |

#### **3.3. Quản lý & Cá nhân hóa**

| Chức năng | Mô tả | Mức độ khả thi |
| :--- | :--- | :--- |
| **Danh sách Theo dõi Cá nhân** | **Tính năng cốt lõi.** Mỗi người dùng có một trang cá nhân để quản lý anime với các trạng thái: **Watching, Completed, On-Hold, Dropped, Plan to Watch**, kèm theo điểm số cá nhân (1-10) và ghi chú riêng. | **Rất khả thi (Bắt buộc)** |
| **Danh sách Tùy chỉnh** | Cho phép người dùng tạo và chia sẻ các danh sách của riêng họ (ví dụ: "Top 10 anime thư giãn"). | **Khả thi, phức tạp trung bình** |

#### **3.4. Tính năng Cộng đồng Nâng cao**

| Chức năng | Mô tả | Mức độ khả thi |
| :--- | :--- | :--- |
| **Đóng góp Phụ đề** | Cho phép Nhóm Sáng tạo hoặc cộng đồng tải lên các file phụ đề (`.srt`, `.vtt`) cho các ngôn ngữ khác nhau. | **Khả thi, phức tạp trung bình** |
| **Xem Chung (Watch Party)** | Cho phép nhiều người xem cùng một tập phim trong một phòng ảo. Video được đồng bộ hóa cho tất cả mọi người. <br>- **Chat Văn bản:** Dành cho tất cả người dùng tham gia. | **Rất khả thi, phức tạp rất cao** (Yêu cầu WebSockets) |
| **Voice Chat (trong Xem Chung)** | **Đặc quyền dành riêng cho gói VIP.** Người dùng VIP có thể sử dụng tính năng "Giữ để nói" (Push-to-Talk) để trò chuyện bằng giọng nói ngay trong phòng Xem Chung. | **Khả thi, phức tạp cực kỳ cao** (Yêu cầu WebRTC) |

#### **3.5. Mô hình Kinh doanh & Kiếm tiền (Monetization)**

Hệ thống kế thừa toàn bộ mô hình kinh doanh từ các phân hệ trước.

*   **Mua lẻ:** Mua Episode, Season.
*   **Cho thuê:** Thuê Season, Anime đã hoàn thành.
*   **Đặc quyền Thuê bao:** Xem trước, loại bỏ quảng cáo, xem chất lượng cao nhất, và **đặc quyền Voice Chat cho VIP**.
*   **Ủng hộ/Donate:** Donate trực tiếp cho Nhóm Sáng tạo.

### **4. Đề xuất Lộ trình Phát triển (Roadmap)**

*   **Giai đoạn 1 (MVP - Xây dựng Nền tảng):**
    *   Hệ thống quản lý Anime/Season/Episode.
    *   Trình phát video với các tính năng cơ bản (Chọn chất lượng).
    *   **Tính năng cốt lõi:** **Danh sách Theo dõi Cá nhân**, **Duyệt theo Mùa**, **Lịch phát sóng**.
    *   Monetization: **Public** và **Mua lẻ**.
    *   Cộng đồng: **Bình luận**, **Yêu thích**, **Đánh giá**.

*   **Giai đoạn 2 (Nâng cao Trải nghiệm & Cộng đồng):**
    *   Triển khai **Cơ sở dữ liệu Nhân vật & Seiyuu**.
    *   Nâng cấp trình phát video: **Nút "Bỏ qua Intro"**, **Tùy chỉnh Phụ đề**.
    *   Triển khai hệ thống **Đóng góp Phụ đề**.
    *   Monetization: Hoàn thiện mô hình **Cho thuê** và **Đặc quyền Thuê bao**.

*   **Giai đoạn 3 (Tính năng Xã hội Đột phá):**
    *   Xây dựng chức năng **Xem Chung (Watch Party) với Chat Văn bản**.

*   **Giai đoạn 4 (Hoàn thiện Trải nghiệm VIP):**
    *   Tích hợp **Voice Chat "Push-to-Talk"** vào Xem Chung như một đặc quyền độc quyền cho người dùng VIP.