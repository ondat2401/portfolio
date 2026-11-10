# Kế hoạch refactor portfolio

## Phạm vi và giả định
- Hiện tại chỉ khảo sát và lập kế hoạch; chưa thay đổi runtime hay giao diện chính.
- Giả định mục tiêu chính là giới thiệu năng lực Unity / Playable Ads cho nhà tuyển dụng hoặc đối tác; cần user xác nhận trước implementation lớn.
- Prototype chạy riêng, dùng nội dung và media hiện có, không ghi Supabase hoặc gửi analytics.

## Hiện trạng đã đọc từ source
- Site tĩnh: index.html, assets/js/main.js (~1.300 dòng), assets/css/style.css (2.153 dòng); chưa thấy package.json.
- main.js chứa tải dữ liệu, render section, phân trang, hash route, modal, playable player, theme và animation.
- Public site đọc JSON; admin thao tác Supabase và xuất JSON. Cần làm rõ quy trình publish để tránh lệch hai nguồn.
- admin.html và dashboard.html chứa style/script inline; có helper Supabase riêng.
- Highlights và danh mục chứa dữ liệu project riêng; slug đang được sinh từ title nên đổi tên có thể đổi deep link.
- Có nội dung placeholder: Short description, Previous Company, LinkedIn chung, mailto trống, store link example; site.url và ogImage trống.
- SQL chứa tài khoản mặc định; admin dùng sessionStorage để ghi trạng thái đăng nhập. Đây là điểm phải kiểm tra quyền backend; chưa kết luận policy đang triển khai từ source cục bộ.
- Chưa chạy browser, compile hay test. Nhận xét giao diện dựa trên markup/style, chưa phải visual audit.

## Hướng thiết kế đề xuất
1. Hướng ưu tiên: game developer showcase. Nền tối trung tính, typography rõ, accent tiết chế, ảnh/video game làm điểm nhấn.
2. Bố cục: Hero ngắn + View selected work / CV → 3 featured projects → project library có filter → kinh nghiệm & năng lực → liên hệ.
3. Case study: bối cảnh → vai trò cá nhân → giải pháp → kết quả có căn cứ → Play demo / store.
4. Tách rõ sản phẩm gốc và phần playable do cá nhân thực hiện; không diễn đạt thành tác giả toàn bộ game nếu không đúng.
5. Hướng thay thế: hồ sơ tối giản thiên tuyển dụng; hoặc arcade tương tác đậm cá tính. Chọn một hướng trước khi code toàn bộ.

## Prototype đề xuất
- Đường dẫn riêng dự kiến prototypes/showcase/index.html; desktop và mobile.
- Một trang có hero, 3 featured projects, library filter và project detail/player.
- Dùng JSON/media thật, không tạo số liệu thành tích mới.
- Kiểm tra luồng xem dự án → xem đóng góp → chơi thử → CV/contact.
- Tiêu chí duyệt: nhận ra chuyên môn ngay đầu trang; CTA rõ; 390px không tràn ngang; keyboard dùng được; mở/đóng demo không giữ audio/iframe chạy nền.
- Prototype chỉ được triển khai sau khi user chọn hướng/phạm vi; không thay trang chính.

## Kiến trúc mục tiêu
- Giữ HTML/CSS/JS hiện tại cho bước đầu; chưa thêm framework hoặc build system khi chưa có nhu cầu cụ thể.
- Entry chỉ điều phối init; tách feature projects, playable, profile, theme/motion. Mỗi feature sở hữu state và event lifecycle của nó.
- Shared chỉ chứa helper thực sự có nhiều caller: data loading, DOM an toàn, API client nếu cần.
- CSS tách tokens/base/layout và style theo feature; chuyển từng phần để tránh đổi cascade hàng loạt.
- Giữ schema JSON và hash cũ trong các bước đầu; thiết kế ID ổn định và adapter tương thích trước mọi migration dữ liệu.
- Public content tiếp tục dùng JSON trong giai đoạn đầu; xác nhận workflow CMS/export trước khi thay nguồn dữ liệu.
- Admin/dashboard là phần riêng, không buộc public site phụ thuộc backend.

## Thứ tự và checkpoint
1. Chốt mục tiêu, phong cách và nội dung ưu tiên.
2. Prototype riêng và duyệt desktop/mobile.
3. Lập baseline hành vi; refactor project library + detail thành một slice hoàn chỉnh với UI cũ.
4. Tách playable player và kiểm tra lifecycle iframe, ratio, reload, Escape.
5. Áp giao diện đã duyệt lần lượt hero/featured, library/detail, profile/contact; giữ route và asset cũ.
6. Làm rõ CMS publish, quyền backend và dashboard; chỉ đổi auth/schema sau khi user duyệt phạm vi.
7. QA toàn site, metadata, links, responsive, accessibility và media loading.

## Rủi ro và cách giảm
- CSS cascade và global state: di chuyển từng feature, kiểm tra trước/sau.
- Deep link bị đổi: giữ hash cũ, chỉ migrate với mapping tương thích đã duyệt.
- Playable bị hỏng đường dẫn tương đối: giữ thư mục projects và thử nhiều demo, cả nhiều biến thể.
- JSON/CMS lệch: có quy trình export/publish duy nhất được mô tả rõ.
- Performance media: chỉ tải player khi người dùng mở; đo trước khi tối ưu thêm.
- Quyền admin: kiểm tra policy và thao tác bằng role thực tế trước khi xem phần admin là hoàn tất.

## Câu hỏi cần chốt
- Ưu tiên tuyển dụng Unity, chuyên môn playable ads hay nhận freelance?
- Chọn showcase, hồ sơ tối giản hay arcade?
- Có tiếp tục dùng admin/CMS hiện tại không?

## Cập nhật được chốt ngày 2026-11-04
Kế hoạch hiện hành: [Comic UI D + Rubik](comic-ui-plan.md). Style đã chốt bản D; dùng quyết định và checklist D1-D7 trong bản cập nhật này cho đợt public UI. Nội dung khảo sát cũ được giữ để tham khảo.
