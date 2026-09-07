UPDATE "Competition"
SET
  "name" = 'AI Arena Vietnam 2026',
  "settings" = "settings" || jsonb_build_object(
    'competitionName', 'AI Arena Vietnam 2026',
    'landingHeroTitle', 'AI Arena',
    'landingHeroHighlight', 'Vietnam 2026',
    'shortDescription', 'Sân chơi quốc gia để sinh viên thực hành kỹ năng đặt câu lệnh cùng Google Gemini và Google AI Studio, xây dựng ứng dụng trong 5–10 phút.',
    'fullDescription', E'Cuộc thi ứng dụng AI do Đại học Quốc gia Hà Nội (ĐHQGHN) triển khai, Trường Đại học Công nghệ (VNU-UET) làm đầu mối phối hợp cùng Google tổ chức. Đây là sân chơi công nghệ mở ra cơ hội thực chiến giải quyết các bài toán thực tế thông qua kỹ năng Prompt Engineering trên nền tảng hai công cụ chính thức: **Google Gemini và Google AI Studio**.\n\nHành trình trải nghiệm bắt đầu từ Vòng tuyển chọn trực tuyến nhằm tìm kiếm 8 đội thi xuất sắc nhất bước vào Vòng Chung kết. Tại vòng đấu quyết định này, 8 đội sẽ trực tiếp tranh tài trên sân khấu để tìm ra nhà vô địch.\n\nVòng Chung kết sẽ chính thức diễn ra vào ngày **03/11/2026 tại Hội trường tầng 1, Trung tâm Văn hóa ULIS - Jonathan KS. Choi, ĐHQGHN** (số 144 Xuân Thủy, Cầu Giấy, Hà Nội).',
    'landingFinalRoundTitle', 'Thể thức vòng chung kết',
    'finalRoundSprintTitle', 'The Sprint',
    'finalRoundPitchTitle', 'The Pitch',
    'finalRoundVerdictTitle', 'The Verdict',
    'finalRoundTwistTitle', 'On-stage Twist',
    'eventDate', '2026-11-03',
    'eventDateStatus', 'CONFIRMED',
    'venueStatus', 'CONFIRMED'
  ),
  "version" = "version" + 1,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "isRehearsal" = false AND "deletedAt" IS NULL;

UPDATE "TimelineItem" AS item
SET
  "title" = landing_values."title",
  "description" = landing_values."description",
  "startAt" = landing_values."startAt",
  "endAt" = landing_values."endAt",
  "statusLabel" = landing_values."statusLabel",
  "updatedAt" = CURRENT_TIMESTAMP
FROM (
  VALUES
    (1, 'Phát động & mở đơn', 'Phát động cuộc thi và chính thức mở cổng đăng ký tham gia trực tuyến cho các đội thi trên toàn quốc.', TIMESTAMP '2026-09-15 00:00:00', NULL::timestamp, 'Dự kiến'),
    (2, 'Vòng tuyển chọn', E'• Đăng ký trực tuyến trên website.\n• Nộp video & thử thách vibe coding với Google Gemini và Google AI Studio.\n• Top 8 đội xuất sắc nhất tiến vào Chung kết.', TIMESTAMP '2026-09-15 00:00:00', TIMESTAMP '2026-10-05 16:59:59', 'Dự kiến'),
    (3, 'Đánh giá & chọn đội', 'Hội đồng Giám khảo chấm, rà soát và lựa chọn đội vào chung kết.', TIMESTAMP '2026-10-06 00:00:00', TIMESTAMP '2026-10-14 16:59:59', 'Dự kiến'),
    (4, 'Công bố danh sách vòng chung kết', 'Công bố 8 đội thi xuất sắc vào vòng Chung kết.', TIMESTAMP '2026-10-15 00:00:00', NULL::timestamp, 'Dự kiến'),
    (5, 'Chung kết & trao giải', E'• Địa điểm: Hội trường tầng 1, Trung tâm Văn hóa ULIS - Jonathan KS. Choi, ĐHQGHN (144 Xuân Thủy, Cầu Giấy, Hà Nội).\n• 8 đội sẽ tranh tài trực tiếp.', TIMESTAMP '2026-11-03 00:00:00', NULL::timestamp, 'Đã chốt')
) AS landing_values("displayOrder", "title", "description", "startAt", "endAt", "statusLabel")
WHERE item."displayOrder" = landing_values."displayOrder"
  AND EXISTS (
    SELECT 1
    FROM "Competition" AS competition
    WHERE competition."id" = item."competitionId"
      AND competition."isRehearsal" = false
      AND competition."deletedAt" IS NULL
  );

UPDATE "StaticPage" AS page
SET
  "title" = 'Tiêu chí chấm điểm',
  "bodyMarkdown" = 'Ban Tổ chức có thể phát hành phiên bản rubric mới.',
  "updatedAt" = CURRENT_TIMESTAMP
FROM "Competition" AS competition
WHERE page."competitionId" = competition."id"
  AND page."slug" = 'tieu-chi-cham'
  AND competition."isRehearsal" = false
  AND competition."deletedAt" IS NULL;

UPDATE "FAQ" AS faq
SET
  "question" = 'Chi phí tham dự Chung kết cho các thí sinh như thế nào?',
  "updatedAt" = CURRENT_TIMESTAMP
FROM "Competition" AS competition
WHERE faq."competitionId" = competition."id"
  AND faq."question" = 'Tham gia cuộc thi có mất phí không?'
  AND competition."isRehearsal" = false
  AND competition."deletedAt" IS NULL;
