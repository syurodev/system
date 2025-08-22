## **Tài liệu Thiết kế: Hệ thống Quản lý Người dùng**
### **1. Mục tiêu**

Xây dựng một hệ thống quản lý người dùng toàn diện, linh hoạt và có khả năng mở rộng, đóng vai trò là nền tảng cho một nền tảng media và thương mại điện tử. Hệ thống phải hỗ trợ xác thực an toàn, quản lý hồ sơ người dùng, mô hình kinh doanh SaaS qua các gói thuê bao, và một hệ thống phân quyền chi tiết theo vai trò (RBAC).

### **2. Các thành phần chính**

Hệ thống được chia thành 4 thành phần chính:

1.  **Xác thực & Quản lý Tài khoản (Authentication & Account Management)**: Xử lý danh tính và quyền truy cập cơ bản của người dùng.
2.  **Hồ sơ Người dùng (User Profile)**: Quản lý thông tin và hoạt động cá nhân của người dùng.
3.  **Quản lý Gói thuê bao (SaaS Subscription Management)**: Xử lý các gói trả phí và quyền lợi đi kèm.
4.  **Hệ thống Phân quyền theo Vai trò (Role-Based Access Control - RBAC)**: Quản lý các quyền hạn chi tiết cho từng nhóm người dùng.

### **3. Thiết kế Chức năng Chi tiết**

#### **3.1. Xác thực & Quản lý Tài khoản**

*   **Công nghệ cốt lõi:** `better-auth`
*   **Chức năng:**
    *   **Đăng ký:**
        *   Yêu cầu: `username` (duy nhất, không dấu, không ký tự đặc biệt), `email` (duy nhất), `password`.
        *   Quy trình: Sau khi đăng ký, hệ thống gửi email xác thực để kích hoạt tài khoản.
    *   **Đăng nhập:**
        *   Người dùng có thể sử dụng `username` hoặc `email` để đăng nhập cùng với mật khẩu.
    *   **Quản lý Session:** `better-auth` sẽ xử lý việc tạo và xác thực session/cookie một cách an toàn.
    *   **Quên mật khẩu:** Người dùng có thể yêu cầu reset mật khẩu qua email.
    *   **(Tùy chọn tương lai):** Đăng nhập bằng mạng xã hội (Google, Facebook).

#### **3.2. Hồ sơ Người dùng**

*   **Chức năng:**
    *   **Thông tin có thể chỉnh sửa:** Tên hiển thị, tiểu sử (bio), ảnh đại diện (avatar).
    *   **Thông tin hệ thống quản lý:**
        *   Lịch sử đọc/xem (đánh dấu chương/tập đã xem).
        *   Lịch sử giao dịch mua hàng.
        *   Danh sách yêu thích/bookmark.
    *   **Quản lý thông báo:** Cho phép người dùng bật/tắt các loại thông báo (ví dụ: thông báo khi truyện yêu thích có chương mới).

#### **3.3. Quản lý Gói thuê bao (SaaS)**

*   **Mô hình:** Hệ thống sẽ có các gói thuê bao để mở khóa các tính năng và nội dung cao cấp.
*   **Các gói đề xuất:**

| Gói | Quyền lợi chính | Mục tiêu |
| :--- | :--- | :--- |
| **Free** | - Đọc/xem nội dung công khai. <br>- Xem quảng cáo. <br>- Xem anime ở độ phân giải SD. | Người dùng phổ thông |
| **Premium** | - Loại bỏ quảng cáo. <br>- Truy cập nội dung trả phí (chương/tập mới nhất). <br>- Xem anime ở độ phân giải HD/FHD. | Người dùng trung thành |
| **VIP** | - Toàn bộ quyền lợi của Premium. <br>- Truy cập nội dung độc quyền. <br>- Giảm giá cố định X% trên sàn TMĐT. <br>- Huy hiệu VIP nổi bật. | Người dùng ủng hộ nhiệt tình |

*   **Yêu cầu kỹ thuật:** Tích hợp với cổng thanh toán (ví dụ: Stripe) để xử lý thanh toán định kỳ và quản lý vòng đời thuê bao (subscription lifecycle) qua webhooks.

#### **3.4. Hệ thống Phân quyền theo Vai trò (RBAC)**

*   **Mục tiêu:** Quản lý chi tiết các hành động mà người dùng được phép thực hiện, tách biệt hoàn toàn với hệ thống xác thực.
*   **Cấu trúc:**
    *   **Permission (Quyền):** Một hành động đơn lẻ (ví dụ: `manga:upload_chapter`).
    *   **Role (Vai trò):** Một tập hợp các Quyền.
    *   **User (Người dùng):** Được gán một hoặc nhiều Vai trò.
*   **Các vai trò đề xuất:**

| Vai trò | Mô tả | Một số quyền chính (Permissions) |
| :--- | :--- | :--- |
| **Member** | Vai trò mặc định cho mọi người dùng đã đăng ký. | `comment:create`, `review:create` |
| **Uploader** | Thành viên của "Nhóm Sáng tạo", có quyền đăng tải nội dung. | `manga:upload_chapter`, `anime:upload_episode` |
| **Moderator** | Người kiểm duyệt, đảm bảo cộng đồng lành mạnh. | `comment:delete_any`, `review:delete_any`, `user:mute` |
| **Admin** | Quản trị viên cấp cao, có quyền truy cập toàn bộ hệ thống. | `user:ban`, `product:create`, `role:assign`, `admin:access_dashboard` |

### **4. Luồng hoạt động & Tích hợp Công nghệ**

*   **Luồng kiểm tra quyền:**
    1.  Người dùng gửi yêu cầu đến một API endpoint được bảo vệ.
    2.  **Middleware của `better-auth`** chạy trước, xác thực session và lấy thông tin `user` (Authentication).
    3.  **Middleware RBAC tùy chỉnh** chạy tiếp theo. Nó sẽ:
        *   Lấy `user.id` từ context.
        *   Thực hiện truy vấn JOIN các bảng `user_roles` và `role_permissions` để lấy ra danh sách tất cả các `permission.name` mà người dùng có.
        *   Kiểm tra xem quyền cần thiết cho endpoint đó có nằm trong danh sách quyền của người dùng không (Authorization).
        *   Nếu có, cho phép xử lý tiếp. Nếu không, trả về lỗi `403 Forbidden`.

*   **Vai trò của các công nghệ:**
    *   **`better-auth`:** Chịu trách nhiệm duy nhất về **Authentication**.
    *   **`ElysiaJS + PostgreSQL`:** Chịu trách nhiệm về **Authorization** thông qua logic nghiệp vụ và cấu trúc CSDL RBAC.
    *   **`Next.js`:** Xây dựng giao diện người dùng cho các form đăng ký/đăng nhập, trang quản lý hồ sơ, trang nâng cấp gói thuê bao.

---