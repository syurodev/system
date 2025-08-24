# Sơ đồ Dự án (Project Map)

Tài liệu này cung cấp một cái nhìn tổng quan về cấu trúc thư mục của dự án, giúp các nhà phát triển mới nhanh chóng hiểu được vai trò và trách nhiệm của từng thành phần trong hệ thống.

## Cấu trúc Tổng quan

Đây là một monorepo được quản lý bởi **Turborepo**, chứa nhiều ứng dụng (`apps`) và các gói dùng chung (`packages`).

---

## 📁 `apps`

Thư mục này chứa các ứng dụng độc lập có thể chạy và triển khai.

- **`APIs/`**: Chứa các microservices backend của hệ thống.
    - **`identify-service/`**: Service chịu trách nhiệm về xác thực, nhận dạng và quản lý thông tin người dùng.

- **`webs/`**: Chứa các ứng dụng frontend.
    - **`wibutime/`**: Ứng dụng web chính cho người dùng, được xây dựng bằng Next.js.

---

## 📁 `packages`

Thư mục này chứa các gói (packages) được chia sẻ và tái sử dụng giữa các ứng dụng trong `apps`.

- **`elysia/`**: Gói cấu hình và các thành phần dùng chung cho backend xây dựng bằng Elysia.js.
    - `connections/`: Quản lý kết nối đến các cơ sở dữ liệu (PostgreSQL, Redis).
    - `handlers/`: Các trình xử lý (handler) dùng chung như xử lý lỗi.
    - `middlewares/`: Các middleware dùng chung như CORS.

- **`eslint-config/`**: Chứa các cấu hình ESLint dùng chung để đảm bảo code style nhất quán trên toàn bộ dự án.

- **`types/`**: Định nghĩa các kiểu dữ liệu (TypeScript types) và enums được sử dụng trên toàn hệ thống, giúp đảm bảo sự nhất quán giữa frontend và backend.

- **`typescript-config/`**: Chứa các cấu hình TypeScript (`tsconfig.json`) cơ sở cho các loại dự án khác nhau (Next.js, React library, base).

- **`ui/`**: Thư viện component React dùng chung cho các ứng dụng web. Các component trong này được thiết kế để có thể tái sử dụng và tuân thủ một hệ thống thiết kế nhất quán.

- **`utils/`**: Chứa các hàm tiện ích phổ biến có thể được sử dụng ở bất kỳ đâu trong dự án (ví dụ: xử lý chuỗi, ngày tháng, mã hóa).

---

## 📁 `db-init`

Thư mục này chứa các file script SQL để khởi tạo cơ sở dữ liệu cho các service khác nhau. Mỗi file `.sql` tương ứng với việc thiết lập schema và dữ liệu ban đầu cho một service.

---

## 📁 `documentations`

Chứa các tài liệu thiết kế và chức năng của dự án.

- **`functionals/`**: Mô tả chi tiết về các luồng chức năng và yêu cầu nghiệp vụ của từng phần trong hệ thống.
