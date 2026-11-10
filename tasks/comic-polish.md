# Comic polish — bản D

## Design contract
- Mục tiêu: xem game/video trước, đọc vai trò và mở playable khi quan tâm.
- Palette: charcoal `#191918`, surface `#242522`, ivory `#eee5d2`, muted ink `#c4beaf`, red `#b34a40`. Màu game giữ nguyên.
- Type: Bangers cho tiêu đề và lời thoại; Barlow cho nội dung và điều khiển. Nội dung căn trái, tối đa 65ch.
- Layout: hero gồm lời giới thiệu + khung Rubik; highlights và library dùng spread 12 cột bất đối xứng. Video dọc đứng riêng như panel truyện, không crop thành landscape.
- Motion: nét mực thay khung, Rubik xoay lớp có anticipation/settle, burst chỉ khi tương tác; không rung chữ hoặc lọc màu video. Có pause motion và reduced motion.

```text
Desktop: [intro / cut paper][Rubik / speech bubble]
         [wide game ........][portrait]
         [game .....][game ...........]
Mobile:  [intro] [Rubik] [game] [game]
```

## Phạm vi
- Chỉnh các stylesheet comic hiện có, renderer hero/caption và module Rubik; dùng lại event/layout helper.
- Đồng bộ highlight, project, about/skills/timeline, modal/player và trạng thái focus/mobile/light theme.
- Asset SVG rời, dùng lại ở prototype. Không thêm dependency, không đổi data/API/modal routing.
- Bỏ nhãn PANEL giả trình tự, hiệu ứng bounce nút lặp và các reveal làm mất nội dung.
- User tự chạy thử; không chạy browser/build/test trong lượt này. Có self-check Rubik để user chạy nếu cần.

## Review trước triển khai
Khung chữ nhật + caption trắng lớn dễ thành video feed. Chuyển thành frame mực lệch và caption giấy cắt nhỏ; giữ video thẳng để dễ xem. Hero là điểm motion chính; phần nội dung dùng phản hồi ngắn và nét viền nhẹ, không thêm màu hoặc hiệu ứng toàn màn hình.

## Đã triển khai
- Hero: thêm phần giới thiệu, CV action, typography và khoảng trống gọn hơn.
- Highlights/library: dùng cùng helper chia spread; caption giấy cắt thay cho mảng trắng lớn; portrait không crop.
- Nét mực: sprite SVG 3 bản vẽ riêng cho frame/bubble; text/video giữ ổn định.
- Rubik: texture mực/halftone, outline silhouette, 12 pose có lấy đà/overshoot/settle; decor bám sự kiện xoay/tách.
- Supporting UI: nav, about, skills, timeline, detail/playable, footer, focus, light theme và mobile.
- Motion toggle tắt decor/cube; OS reduced-motion được tôn trọng. Không đổi framework/dependency.
- Bỏ global button/canvas styles khỏi shared hero CSS để tránh ảnh hưởng điều khiển Bootstrap.
- Catch autoplay rejection, loại bỏ rAF khiến preview có thể hiện lại sau mouseleave; filter có aria-pressed.

## Bàn giao kiểm tra (chưa chạy)
- Trang chính: desktop và màn hình 320/390/768px; video dọc Cat Bus Jam; filter/pager/detail/playable.
- Rubik: chờ hết một chu kỳ, hover giữa lượt xoay, rời chuột, bấm tách/ghép, toggle motion và reduced-motion.
- Light/dark theme, focus bằng Tab; prototype dùng chung Rubik và asset motion.
- Self-check được viết nhưng chưa chạy: `node --test tests/rubik-turns.test.js`.
- Chưa chạy build, browser, test theo phân công user tự test; chưa khẳng định kết quả render/performance thực tế.

## Skills workbench
- User approved: Build large left panel, Game Feel / Ship & Improve stacked right; one column on mobile.
- Reuses charcoal/ivory/red and Bangers/Barlow. Six existing skills retained, grouped explicitly in profile data.
- Replaced skills pagination and full bars with three panels, short descriptions and real project links using existing hash routing.
- Five independent SVG assets; hover/focus runs a short puzzle fit / waveform reveal / chart reveal. No JS animation loop.
- Removed obsolete skills pagination/bar initialization; prototype still reads the compatible flat skills array.
- Added data self-check for populated groups and valid project references: `node --test tests/skill-groups.test.js` (not run).
- No browser/build/test run; user owns runtime and visual verification.

## Transforming sculpture
- 54 reusable bricks (two per Rubik cubelet), with Rubik → Gamepad → Robot → Rubik choreography.
- `assets/js/features/cube-forms.js` owns silhouette patterns, poses, scatter positions and curved/staggered assembly sampling. The original 3×3 layer-turn helper remains in use.
- `hero-rubik.js` renders solid/outline/ghost instances; no new dependency or external model. Rendering is capped at 24 fps; held animation poses run at 12–16 fps.
- Gamepad pauses for 4.5s, robot pauses for 6s and performs a short head tilt / wave. Each transformation takes 3s. Rubik plays its scramble/inverse sequence before moving on.
- Hover pauses the choreography and separates the current pose; leaving reassembles it. Break Apart pins that view. Transform retargets from the current pose, including during an ongoing transformation.
- Motion off / OS reduced motion stop autoplay; Transform switches directly to the next assembled shape. Offscreen and hidden-tab rendering are skipped.
- Updated both public hero and standalone prototype controls. Bubble lettering, bursts and ink afterimages follow sculpture state.
- Added `tests/cube-forms.test.js`: part counts, unique positions, endpoint poses, bounded trajectories and mid-flight retarget continuity. Not executed.
- No build/browser/tests run, per user-owned verification. Check silhouette readability, camera framing on narrow mobile, rapid Transform clicks, hover mid-flight, pause and resume.
