import Link from "next/link";
import {
  DocBulletList,
  DocFootnote,
  DocNestedList,
  DocParagraph,
  DocSection,
  DocSubsection,
  DocTable,
} from "@/components/public/the-le/rules-primitives";

const SCORING_ROWS = [
  [
    "Execution / Feasibility",
    "50%",
    "Khả năng tạo được proof of concept hoạt động trong thời gian thi; mức độ đáp ứng problem statement; tính sử dụng được của kết quả.",
    "Ưu tiên cao nhất.",
  ],
  [
    "Vision",
    "30%",
    "Khả năng giải thích hướng phát triển, giá trị tương lai, problem-solution fit và khả năng mở rộng.",
    "Đánh giá chủ yếu qua pitch và Q&A của Ban Giám khảo",
  ],
  [
    "Creativity",
    "20%",
    "Mức độ mới, khác biệt, cách khai thác AI và tư duy ngoài khuôn mẫu.",
    "Khuyến khích giải pháp độc đáo.",
  ],
];

const SCHEDULE_ROWS = [
  ["15/9/2026", "Công bố cuộc thi, mở đăng ký và nhận bài dự thi."],
  ["15/9–10/10/2026", "Tiếp nhận đăng ký và bài dự thi."],
  ["06–14/10/2026", "Chấm, rà soát và lựa chọn 08 đội vào Chung kết."],
  ["15/10/2026", "Công bố 08 đội Chung kết."],
  ["16–30/10/2026", "Tập huấn cho các đội vào chung kết"],
  ["Sáng 03/11/2026", "Vòng chung kết trực tiếp kết hợp livestream."],
];

export function TheLePage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 md:px-6">
      <header className="space-y-1 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#424753]">Đại học Quốc gia Hà Nội</p>
        <p className="text-sm font-semibold uppercase tracking-wide text-[#424753]">Trường Đại học Công nghệ</p>
        <p className="pt-4 text-sm font-bold uppercase tracking-[0.14em] text-[#1c1b1b]">Thể lệ chính thức</p>
        <h1 className="display pt-2 text-3xl font-extrabold uppercase text-[#1c1b1b] md:text-4xl">Thể lệ cuộc thi</h1>
        <p className="display text-2xl font-bold text-[#1c1b1b]">AI Arena Vietnam 2026</p>
        <p className="text-lg font-semibold text-[#424753]">Đấu trường AI</p>
      </header>

      <DocParagraph>
        Thể lệ này quy định đối tượng, hình thức đăng ký, nội dung, thể thức thi, tiêu chí chấm, quy định sử dụng công
        cụ AI và các trách nhiệm liên quan đối với cuộc thi AI Arena Vietnam 2026.
      </DocParagraph>

      <div className="mt-10 space-y-10">
        <DocSection title="I. MỤC ĐÍCH VÀ YÊU CẦU">
          <DocBulletList
            items={[
              "Tạo sân chơi để sinh viên ứng dụng AI tạo sinh, kỹ năng prompting và tư duy sản phẩm nhằm giải quyết các bài toán thực tiễn, xây dựng nhanh proof of concept bằng Gemini và Google AI Studio.",
              "Khuyến khích khả năng phân tích vấn đề, sáng tạo giải pháp, triển khai sản phẩm trong thời gian giới hạn và trình bày ý tưởng một cách thuyết phục.",
            ]}
          />
        </DocSection>

        <DocSection title="II. ĐỐI TƯỢNG VÀ ĐIỀU KIỆN DỰ THI">
          <DocSubsection title="1. Đối tượng">
            <DocBulletList
              items={[
                "Sinh viên đang học tại các đại học, trường đại học và cơ sở giáo dục đại học trên toàn quốc.",
              ]}
            />
          </DocSubsection>
          <DocSubsection title="2. Thành phần đội thi">
            <DocBulletList
              items={[
                "Thi theo đội; mỗi đội có tối đa 03 thành viên. Thí sinh tự chuẩn bị laptop cá nhân.",
                "Các thành viên trong cùng đội phải hoàn tất đăng ký theo yêu cầu của Ban Tổ chức (BTC).",
                "Mỗi sinh viên chỉ tham gia 01 đội trong toàn bộ cuộc thi.",
              ]}
            />
          </DocSubsection>
          <DocSubsection title="3. Điều kiện hợp lệ">
            <DocBulletList
              items={[
                "Cung cấp đầy đủ, chính xác thông tin đăng ký và bài dự thi theo thời hạn công bố.",
                "Tuân thủ Thể lệ, Chuẩn mực Hành vi (Code of Conduct), quy định AI Có Trách nhiệm (Responsible AI) và các hướng dẫn kỹ thuật của BTC.",
                "Cam kết sản phẩm, nội dung trình bày và dữ liệu sử dụng không vi phạm quyền sở hữu trí tuệ, quyền riêng tư hoặc quy định pháp luật.",
              ]}
            />
          </DocSubsection>
        </DocSection>

        <DocSection title="III. CÔNG CỤ VÀ PHƯƠNG THỨC THI">
          <DocBulletList
            items={[
              "Công cụ AI chính thức: Google Gemini và Google AI Studio.",
              "Vòng tuyển chọn: thí sinh sử dụng tài khoản Google AI Plus. Các thí sinh có thể đăng ký tài khoản Google AI Plus miễn phí¹.",
              "Vòng Chung kết: 08 đội được lựa chọn sẽ được cấp tài khoản Google AI Pro để bảo đảm hạn mức sử dụng tương đương giữa các đội.",
              "Prompt được nhập bằng bàn phím. Thành viên trong đội được phép trao đổi bằng lời nói; việc sử dụng voice prompt không phải là phương thức chính thức trong thi đấu trực tiếp.",
              "BTC có quyền yêu cầu các đội sử dụng môi trường, tài khoản, thiết bị hoặc cấu hình kỹ thuật thống nhất tại vòng Chung kết.",
            ]}
          />
          <DocFootnote>
            <sup>1</sup> Cách thức nhận ưu đãi: Truy cập link{" "}
            <Link href="https://goo.gle/ai-student-university-vn" className="text-[#2565c7] underline">
              https://goo.gle/ai-student-university-vn
            </Link>
            ; nhập mã số sinh viên &amp; email trường để xác thực.
          </DocFootnote>
        </DocSection>

        <DocSection title="IV. CÁC VÒNG THI">
          <DocSubsection title="1. Vòng Audition">
            <DocBulletList
              items={[
                "Đăng ký trực tuyến trên hệ thống.",
                "Bài Audition gồm phần giới thiệu ngắn và thử thách vibe coding sử dụng Google Gemini/AI Studio theo đề bài của BTC.",
                "BTC chấm bài theo Tiêu chí công bố (xem Mục VI dưới đây) và lựa chọn 08 đội vào vòng Chung kết.",
              ]}
            />
          </DocSubsection>
          <DocSubsection title="2. Vòng Chung kết">
            <DocBulletList
              items={[
                "Gồm 08 đội, thi theo hình thức loại trực tiếp: Tứ kết, Bán kết, Chung kết.",
                "Các đội được ghép cặp ngẫu nhiên và thi đấu trực tiếp.",
                "Trong cùng một trận, hai đội nhận cùng một vấn đề cần giải quyết (problem statement) nhằm bảo đảm tính công bằng và khả năng so sánh.",
              ]}
            />
          </DocSubsection>
        </DocSection>

        <DocSection title="V. CẤU TRÚC MỘT TRẬN ĐẤU VÒNG CHUNG KẾT">
          <DocSubsection title="1. Challenge Reveal">
            <DocBulletList items={["BTC công bố vấn đề cần giải quyết cho hai đội cùng thời điểm."]} />
          </DocSubsection>
          <DocSubsection title="2. The Sprint / Build">
            <DocBulletList
              items={[
                "Các đội phân tích bài toán, xây dựng ý tưởng, nhập prompt và tạo proof of concept bằng công cụ được phép trong thời gian giới hạn.",
                "Mục tiêu là sản phẩm có thể demo được; không yêu cầu một hệ thống hoàn chỉnh, backend đầy đủ hoặc người dùng thật.",
                "Thời lượng chính thức: dự kiến 05–10 phút. BTC sẽ thông báo chính thức trước Vòng Chung kết.",
              ]}
            />
          </DocSubsection>
          <DocSubsection title="3. The Pitch">
            <DocBulletList
              items={[
                "Mỗi đội có tối đa 60 giây để trình bày sản phẩm, cách tiếp cận, giá trị giải pháp và hướng phát triển tiếp theo.",
              ]}
            />
          </DocSubsection>
          <DocSubsection title="4. Q&A">
            <DocBulletList
              items={[
                "Mỗi giám khảo được hỏi tối đa 01 câu cho mỗi đội; thời lượng cụ thể do BTC điều phối theo tiến độ thực tế.",
              ]}
            />
          </DocSubsection>
          <DocSubsection title="5. The Verdict">
            <DocBulletList
              items={[
                "Ban Giám khảo chấm điểm theo Tiêu chí công bố và xác định đội thắng trận.",
                "Ngoài giải chuyên môn, BTC sẽ trao giải khán giả bình chọn qua livestream (Audience Choice Award); kết quả bình chọn khán giả không thay thế kết quả chuyên môn của Ban Giám khảo.",
              ]}
            />
          </DocSubsection>
        </DocSection>

        <DocSection title="VI. TIÊU CHÍ CHẤM ĐIỂM">
          <DocParagraph>
            BTC sử dụng thang điểm 10 với ba nhóm tiêu chí. Trọng số cuối cùng được công bố trước khi vòng Chung kết
            diễn ra:
          </DocParagraph>
          <DocTable
            caption="Bảng tiêu chí chấm điểm"
            headers={["Tiêu chí", "Tỉ lệ", "Nội dung đánh giá", "Ghi chú"]}
            rows={SCORING_ROWS}
          />
          <DocParagraph>
            Trường hợp hai đội có tổng điểm bằng nhau, BTC/Ban Giám khảo sử dụng điểm Execution / Feasibility làm tiêu
            chí ưu tiên; nếu vẫn bằng nhau, Ban Giám khảo thảo luận và biểu quyết.
          </DocParagraph>
        </DocSection>

        <DocSection title="VII. QUY ĐỊNH VỀ CÔNG BẰNG, AN TOÀN VÀ HÀNH VI">
          <ul className="list-disc space-y-3 pl-5 text-[15px] leading-7 text-[#424753] marker:text-[#424753]">
            <li>Không được truy cập trái phép vào tài liệu đề thi hoặc chia sẻ đề thi chưa công bố.</li>
            <li>Không sử dụng nội dung, mã nguồn, dữ liệu hoặc tài sản trí tuệ của bên thứ ba trái phép.</li>
            <li>Không nhận hỗ trợ trực tiếp từ người ngoài đội trong thời gian thi chính thức.</li>
            <li>Không can thiệp, gây nhiễu hoặc làm gián đoạn thiết bị, kết nối hoặc phần thi của đội khác.</li>
            <li>Tuân thủ hướng dẫn của BTC, Ban Giám khảo, MC và bộ phận kỹ thuật trong toàn bộ thời gian diễn ra sự kiện.</li>
            <li>
              Sử dụng AI có trách nhiệm và chuẩn mực hành vi:
              <ul className="mt-2 list-[square] space-y-2 pl-5 marker:text-[#424753]">
                <li>
                  Thí sinh phải tuân thủ pháp luật hiện hành, Điều khoản dịch vụ của Google và Chính sách về các hành vi bị
                  cấm khi sử dụng AI tạo sinh của Google trong toàn bộ quá trình tham gia cuộc thi.
                </li>
                <li>
                  Nghiêm cấm sử dụng Google Gemini, Google AI Studio hoặc hệ thống của cuộc thi để thực hiện hoặc hỗ trợ các
                  hoạt động bất hợp pháp, gây hại, lừa đảo, xâm phạm quyền riêng tư, quyền sở hữu trí tuệ, an toàn thông tin;
                  tạo mã độc, phishing; phát tán nội dung thù ghét, bạo lực, khiêu dâm hoặc các nội dung khác bị Google cấm.
                </li>
                <li>Nghiêm cấm tìm cách vượt qua, vô hiệu hóa hoặc né tránh các cơ chế an toàn và kiểm soát của nền tảng.</li>
                <li>
                  Thí sinh chịu trách nhiệm về tính hợp pháp của dữ liệu, hình ảnh, mã nguồn và các tài liệu đưa vào hệ thống AI;
                  không sử dụng dữ liệu cá nhân, dữ liệu nhạy cảm hoặc tài sản trí tuệ của bên thứ ba khi chưa có quyền sử dụng
                  phù hợp.
                </li>
              </ul>
            </li>
            <li>BTC có quyền cảnh cáo, trừ điểm, dừng phần thi hoặc loại đội khỏi cuộc thi tùy theo mức độ vi phạm.</li>
          </ul>
        </DocSection>

        <DocSection title="VIII. XỬ LÝ SỰ CỐ KỸ THUẤT">
          <DocBulletList
            items={[
              "Sự cố phát sinh từ hạ tầng do BTC cung cấp được bộ phận kỹ thuật ghi nhận và báo cho trọng tài/điều phối trận đấu.",
              "BTC có thể tạm dừng đồng hồ, cộng bù thời gian hoặc tổ chức lại phần thi nếu xác định lỗi kỹ thuật ảnh hưởng đáng kể đến tính công bằng.",
              "Lỗi do thiết bị cá nhân, thao tác sai hoặc tài khoản riêng của đội có thể không được bù thời gian nếu không thuộc trách nhiệm của BTC.",
              "Quyết định của BTC về xử lý sự cố kỹ thuật là quyết định cuối cùng tại thời điểm thi.",
            ]}
          />
        </DocSection>

        <DocSection title="IX. SỞ HỮU TRÍ TUỆ, HÌNH ẢNH VÀ TRUYỀN THÔNG">
          <DocBulletList
            items={[
              "Đội thi chịu trách nhiệm về tính hợp pháp của dữ liệu, tài liệu, hình ảnh, nội dung và mã nguồn sử dụng trong bài thi.",
              "Đội thi đồng ý để BTC ghi hình, phát livestream, chụp ảnh và sử dụng hình ảnh/phần trình diễn phục vụ truyền thông cho chương trình theo quy định của BTC.",
              "Việc sử dụng tên, logo và tài sản thương hiệu Google/VNU trong tài liệu công khai phải được hai bên thống nhất trước khi phát hành.",
              "Quyền sở hữu đối với sản phẩm dự thi thuộc đội thi, trừ trường hợp có thỏa thuận khác được xác lập bằng văn bản; BTC được quyền sử dụng bản ghi phần thi cho mục đích truyền thông, tổng kết và quảng bá chương trình.",
            ]}
          />
        </DocSection>

        <DocSection title="X. LỊCH TRÌNH">
          <DocTable caption="Lịch trình cuộc thi" headers={["Thời gian", "Nội dung"]} rows={SCHEDULE_ROWS} />
        </DocSection>

        <DocSection title="XI. CƠ CẤU GIẢI THƯỞNG">
          <DocNestedList
            items={[
              {
                label: "Giải nhất:",
                children: [
                  "Danh hiệu Prompt Master/AI Arena Champion theo quyết định chính thức của BTC.",
                  "Tài khoản Gemini Ultra trong một năm cho mỗi thành viên trong đội thi.",
                  "Tham quan trụ sở Google tại Singapore trong 3 ngày 2 đêm.",
                ],
              },
              {
                label: "Giải nhì:",
                children: ["Tài khoản Gemini Ultra trong một năm cho mỗi thành viên trong đội thi."],
              },
              {
                label: "Giải ba:",
                children: ["Tài khoản Gemini Pro trong một năm cho mỗi thành viên trong đội thi."],
              },
              {
                label: "8 đội vào vòng Chung kết:",
                children: [
                  "Bộ quà tặng của Google, gồm: Áo polo, balo, cốc giữ nhiệt, túi đựng laptop.",
                  "Được tập huấn bởi các mentor của Google Lab.",
                ],
              },
              {
                label: "Các đội đăng ký tham dự cuộc thi:",
                children: ["Được cung cấp tài liệu hướng dẫn vibe coding do Google biên soạn."],
              },
            ]}
          />
        </DocSection>

        <DocSection title="XII. KHIẾU NẠI VÀ QUYẾT ĐỊNH CUỐI CÙNG">
          <DocBulletList
            items={[
              "Khiếu nại liên quan đến tư cách dự thi, điểm số hoặc sự cố phải được gửi cho BTC theo đầu mối và thời hạn do BTC công bố.",
              "BTC có quyền yêu cầu đội cung cấp log, lịch sử prompt, file hoặc dữ liệu liên quan để phục vụ xác minh.",
              "Quyết định cuối cùng thuộc Ban Tổ chức sau khi tham khảo Ban Giám khảo và bộ phận chuyên môn/kỹ thuật có liên quan.",
            ]}
          />
        </DocSection>

        <DocSection title="XIII. ĐIỀU KHOẢN THI HÀNH">
          <DocParagraph>
            Thể lệ có hiệu lực kể từ ngày được Ban Tổ chức phê duyệt và công bố. BTC được quyền cập nhật các chi tiết kỹ
            thuật, thời gian hoặc quy trình vận hành khi cần thiết để bảo đảm chất lượng và tính công bằng của cuộc thi;
            mọi thay đổi quan trọng phải được thông báo cho thí sinh trước khi áp dụng.
          </DocParagraph>
          <p className="pt-4 text-center text-sm font-bold uppercase tracking-[0.14em] text-[#424753]">Ban Tổ chức</p>
        </DocSection>
      </div>
    </article>
  );
}
