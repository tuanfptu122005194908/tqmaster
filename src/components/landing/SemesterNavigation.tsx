import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SemesterCourse {
  code: string;
  name: string;
  description: string;
  mockCount: number;
  hasPe: boolean;
  hasCheatSheet: boolean;
  questionCount: number;
}

const SEMESTER_DATA: Record<number, { title: string; subtitle: string; courses: SemesterCourse[] }> = {
  1: {
    title: 'Kỳ 1 — Nền Tảng Khởi Đầu',
    subtitle: 'Nhập môn lập trình, tư duy thuật toán C và kiến thức máy tính căn bản.',
    courses: [
      {
        code: 'PRF192',
        name: 'Programming Fundamentals (C)',
        description: 'Cơ bản cú pháp C, con trỏ (pointers), mảng, cấu trúc dữ liệu cơ bản và bài tập code.',
        mockCount: 10,
        hasPe: true,
        hasCheatSheet: true,
        questionCount: 420,
      },
      {
        code: 'CSI104',
        name: 'Introduction to Computer Science',
        description: 'Lịch sử máy tính, biểu diễn nhị phân, mạng máy tính và thuật toán trừu tượng.',
        mockCount: 8,
        hasPe: false,
        hasCheatSheet: true,
        questionCount: 320,
      },
      {
        code: 'MAE101',
        name: 'Mathematics for Engineering',
        description: 'Giải tích toán học, ma trận, đạo hàm và tích phân ứng dụng công nghệ thông tin.',
        mockCount: 8,
        hasPe: false,
        hasCheatSheet: true,
        questionCount: 350,
      },
    ],
  },
  2: {
    title: 'Kỳ 2 — Tư Duy Đối Tượng & Phần Cứng',
    subtitle: 'Chuyển đổi sang Java OOP, logic toán rời rạc và nguyên lý hệ điều hành.',
    courses: [
      {
        code: 'PRO192',
        name: 'Object-Oriented Programming (Java)',
        description: 'Bốn trụ cột OOP, Java Collections API, xử lý Exception và luyện đề thi PE thực hành NetBeans.',
        mockCount: 14,
        hasPe: true,
        hasCheatSheet: true,
        questionCount: 560,
      },
      {
        code: 'MAD101',
        name: 'Discrete Mathematics',
        description: 'Logic mệnh đề, tập hợp, quan hệ, lý thuyết đồ thị và cây nhị phân ứng dụng trong lập trình.',
        mockCount: 10,
        hasPe: false,
        hasCheatSheet: true,
        questionCount: 400,
      },
      {
        code: 'OSG202',
        name: 'Operating Systems',
        description: 'Quản lý tiến trình (Processes & Threads), lập lịch CPU, bộ nhớ ảo và đồng bộ hóa Deadlock.',
        mockCount: 10,
        hasPe: false,
        hasCheatSheet: true,
        questionCount: 450,
      },
      {
        code: 'CEA201',
        name: 'Computer Architecture',
        description: 'Tập lệnh MIPS/ARM, ALU, cấu trúc CPU pipelining, Cache và bộ nhớ máy tính.',
        mockCount: 8,
        hasPe: false,
        hasCheatSheet: true,
        questionCount: 360,
      },
    ],
  },
  3: {
    title: 'Kỳ 3 — Cấu Trúc Dữ Liệu & Cơ Sở Dữ Liệu',
    subtitle: 'Các môn học cốt lõi quyết định nền tảng kỹ sư phần mềm chuyên nghiệp.',
    courses: [
      {
        code: 'CSD201',
        name: 'Data Structures and Algorithms',
        description: 'Linked list, Tree (BST, AVL), Graph (Dijkstra, Prim), thuật toán sắp xếp và giải thuật đệ quy.',
        mockCount: 12,
        hasPe: true,
        hasCheatSheet: true,
        questionCount: 520,
      },
      {
        code: 'DBI202',
        name: 'Introduction to Databases (SQL)',
        description: 'Mô hình ERD, chuẩn hóa CSDL (1NF-3NF), viết truy vấn SQL Server phức tạp và Trigger/Procedure.',
        mockCount: 12,
        hasPe: true,
        hasCheatSheet: true,
        questionCount: 480,
      },
      {
        code: 'MAS291',
        name: 'Probability & Statistics',
        description: 'Xác suất thống kê, phân phối chuẩn, kiểm định giả thuyết và hồi quy tuyến tính.',
        mockCount: 10,
        hasPe: false,
        hasCheatSheet: true,
        questionCount: 390,
      },
    ],
  },
  4: {
    title: 'Kỳ 4 — Kỹ Nghệ Web & Phần Mềm',
    subtitle: 'Bắt đầu làm quen với kiến trúc web MVC, Java Web Servlet và quy trình Agile.',
    courses: [
      {
        code: 'SWE201c',
        name: 'Software Engineering Intro',
        description: 'Mô hình phát triển Agile/Scrum, biểu đồ UML UseCase/Class, kiểm thử và thiết kế kiến trúc.',
        mockCount: 10,
        hasPe: false,
        hasCheatSheet: true,
        questionCount: 410,
      },
      {
        code: 'PRJ301',
        name: 'Java Web Applications (Servlet & JSP)',
        description: 'Kiến trúc MVC, Servlet, JSP, JSTL, quản lý Session/Cookie và kết nối JDBC CSDL.',
        mockCount: 12,
        hasPe: true,
        hasCheatSheet: true,
        questionCount: 460,
      },
    ],
  },
  5: {
    title: 'Kỳ 5 — Dự Án Thực Chiến (SWP391)',
    subtitle: 'Phát triển dự án phần mềm theo nhóm thực tế và công nghệ hiện đại IoT/Frontend.',
    courses: [
      {
        code: 'SWP391',
        name: 'Software Development Project',
        description: 'Tài liệu SRS, kiến trúc hệ thống, Scrum Sprint và kinh nghiệm bảo vệ hội đồng FPT.',
        mockCount: 6,
        hasPe: true,
        hasCheatSheet: true,
        questionCount: 280,
      },
      {
        code: 'WED201c',
        name: 'Web Design & HTML/CSS',
        description: 'HTML5 semantic, CSS Grid, Flexbox, Responsive UI và tương tác JavaScript DOM.',
        mockCount: 8,
        hasPe: true,
        hasCheatSheet: true,
        questionCount: 340,
      },
    ],
  },
  6: {
    title: 'Kỳ 6 — Chuyên Sâu .NET & Kiến Trúc',
    subtitle: 'Mở rộng nền tảng công nghệ Microsoft C# .NET và thiết kế kiến trúc phần mềm.',
    courses: [
      {
        code: 'PRN211',
        name: 'Basic Cross-Platform (.NET & C#)',
        description: 'Ngôn ngữ C#, Windows Forms/WPF, LINQ to Objects, Entity Framework Core và lập trình bất đồng bộ.',
        mockCount: 12,
        hasPe: true,
        hasCheatSheet: true,
        questionCount: 470,
      },
      {
        code: 'SWD392',
        name: 'Software Architecture & Design',
        description: 'Các mẫu thiết kế Design Patterns (GoF), Clean Architecture, Microservices và tối ưu bảo mật.',
        mockCount: 10,
        hasPe: false,
        hasCheatSheet: true,
        questionCount: 390,
      },
    ],
  },
  7: {
    title: 'Kỳ 7 — Doanh Nghiệp & RESTful API',
    subtitle: 'Xây dựng dịch vụ API backend quy mô doanh nghiệp và chuẩn bị cho kỳ thực tập OJT.',
    courses: [
      {
        code: 'PRN231',
        name: 'Building RESTful APIs with ASP.NET',
        description: 'ASP.NET Core Web API, JWT Authentication, Swagger OpenAPI, DTO và Repository Pattern.',
        mockCount: 10,
        hasPe: true,
        hasCheatSheet: true,
        questionCount: 420,
      },
    ],
  },
  8: {
    title: 'Kỳ 8 — On-the-Job Training (OJT)',
    subtitle: 'Thực tập tại các tập đoàn công nghệ (FPT Software, VNPT, Momo, VNG...) và báo cáo chuyên đề.',
    courses: [
      {
        code: 'OJT201',
        name: 'On-the-Job Training Preparation',
        description: 'Kỹ năng phỏng vấn kỹ thuật, viết CV chuẩn IT, xử lý bài test doanh nghiệp và quy trình làm việc.',
        mockCount: 6,
        hasPe: false,
        hasCheatSheet: true,
        questionCount: 220,
      },
    ],
  },
  9: {
    title: 'Kỳ 9 — Khóa Luận Tốt Nghiệp (Capstone)',
    subtitle: 'Bảo vệ đồ án tốt nghiệp cuối cùng trước hội đồng giảng viên và chuyên gia doanh nghiệp.',
    courses: [
      {
        code: 'SEP490',
        name: 'Software Engineering Capstone',
        description: 'Quy trình hoàn thiện sản phẩm công nghệ, kiểm thử tải, viết tài liệu luận văn và kỹ năng thuyết trình.',
        mockCount: 4,
        hasPe: true,
        hasCheatSheet: true,
        questionCount: 180,
      },
    ],
  },
};

export default function SemesterNavigation() {
  const navigate = useNavigate();
  const [selectedSemester, setSelectedSemester] = useState<number>(2);

  const currentData = SEMESTER_DATA[selectedSemester] || SEMESTER_DATA[2];

  const semesters = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  return (
    <section
      id="subjects"
      className="py-20 lg:py-28 border-b border-slate-200/80 relative overflow-hidden font-barlow"
      style={{
        background:
          'radial-gradient(1100px 420px at 50% -10%, rgba(37,99,235,0.07), transparent 65%), #ffffff',
      }}
    >
      {/* subtle dot texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section Header with Scroll Reveal */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-3xl mx-auto mb-12 space-y-3"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider">
            <Layers size={13} className="text-blue-600" />
            <span>Semester-Based Curriculum</span>
          </div>

          <h2 className="font-bebas text-5xl sm:text-6xl lg:text-7xl text-slate-900 leading-[0.95] tracking-wide">
            Choose your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">semester.</span>
            <br />
            Start instantly.
          </h2>

          <p className="text-base text-slate-600 font-normal">
            Every semester is mapped out with official FPT University course matrices, mock exams,
            and practice materials.
          </p>
        </motion.div>

        {/* ── Semester Journey Timeline Rail ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="mb-12"
        >
          <div className="overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-2">
            <div className="relative flex items-start min-w-[720px] sm:min-w-0 pt-2 pb-1">
              {/* Base rail */}
              <div className="absolute left-0 right-0 top-[26px] h-[3px] rounded-full bg-slate-200" />
              {/* Filled progress rail up to active station */}
              <motion.div
                className="absolute left-0 top-[26px] h-[3px] rounded-full bg-gradient-to-r from-blue-500 via-blue-600 to-cyan-500 origin-left"
                initial={false}
                animate={{ width: `${((selectedSemester - 1) / 8) * 100}%` }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                style={{ boxShadow: '0 0 12px rgba(37,99,235,0.5)' }}
              />

              {semesters.map((sem) => {
                const isActive = selectedSemester === sem;
                const isPassed = sem < selectedSemester;
                return (
                  <div key={sem} className="relative flex-1 flex flex-col items-center">
                    <button
                      onClick={() => setSelectedSemester(sem)}
                      aria-label={`Kỳ ${sem}`}
                      className="group relative flex flex-col items-center cursor-pointer outline-none"
                    >
                      {/* Node */}
                      <span
                        className={`relative z-10 flex items-center justify-center rounded-full font-bebas transition-all duration-300 ${
                          isActive
                            ? 'w-14 h-14 text-2xl text-white bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-500/40 scale-110'
                            : isPassed
                            ? 'w-10 h-10 text-lg text-blue-600 bg-white border-2 border-blue-500 group-hover:bg-blue-50'
                            : 'w-10 h-10 text-lg text-slate-400 bg-white border-2 border-slate-200 group-hover:border-blue-300 group-hover:text-blue-500'
                        }`}
                        style={isActive ? { animation: 'sem-node-pulse 2.2s ease-out infinite' } : undefined}
                      >
                        {isActive && (
                          <span className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 blur-md opacity-60 -z-10" />
                        )}
                        {String(sem).padStart(2, '0')}
                      </span>
                      {/* Label */}
                      <span
                        className={`mt-2 text-[11px] font-extrabold uppercase tracking-widest transition-colors duration-300 ${
                          isActive ? 'text-blue-700' : isPassed ? 'text-blue-500' : 'text-slate-400 group-hover:text-slate-600'
                        }`}
                      >
                        Kỳ {sem}
                      </span>
                      {/* Active underline indicator */}
                      <span
                        className={`mt-1 h-1 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 transition-all duration-300 ${
                          isActive ? 'w-8 opacity-100' : 'w-0 opacity-0'
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Active Semester Content with Stagger Animation */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`sem-${selectedSemester}`}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
          >
            {/* Active Semester Summary Header */}
            <div className="relative overflow-hidden rounded-3xl p-6 sm:p-7 mb-8 border border-blue-100 shadow-xl shadow-blue-600/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800">
              {/* Giant watermark number */}
              <div className="pointer-events-none select-none absolute -right-3 -bottom-8 font-bebas text-[9rem] leading-none text-white/10">
                {String(selectedSemester).padStart(2, '0')}
              </div>
              <div className="absolute inset-0 opacity-25 pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.35) 1px, transparent 1px)', backgroundSize: '22px 22px' }}
              />
              <div className="relative">
                <div className="text-[11px] font-extrabold text-cyan-300 uppercase tracking-[0.2em] mb-1">
                  Semester Overview
                </div>
                <h3 className="font-bebas text-3xl sm:text-4xl text-white tracking-wide leading-none">
                  {currentData.title}
                </h3>
                <p className="text-sm text-blue-100/90 mt-1.5 max-w-xl">
                  {currentData.subtitle}
                </p>
              </div>
              <span className="relative text-xs font-bold text-white bg-white/15 backdrop-blur border border-white/25 px-3.5 py-2 rounded-xl self-start sm:self-auto whitespace-nowrap">
                {currentData.courses.length} Core Subjects
              </span>
            </div>

            {/* Subject Cards Grid with Stagger */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentData.courses.map((course, idx) => (
                <motion.div
                  key={course.code}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: idx * 0.08 }}
                  className="relative bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-2xl hover:shadow-blue-600/10 hover:border-blue-300 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group overflow-hidden"
                >
                  {/* hover gradient edge */}
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-blue-600 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div>
                    {/* Card Top */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-bebas px-3 py-1 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 text-base tracking-widest group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-colors">
                        {course.code}
                      </span>
                      <span className="text-xs text-slate-400 font-semibold tabular">
                        {course.questionCount}+ Questions
                      </span>
                    </div>

                    <h4 className="text-lg font-extrabold text-slate-900 tracking-tight mb-2">
                      {course.name}
                    </h4>

                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6 font-normal line-clamp-3">
                      {course.description}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 mb-6">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                        {course.mockCount} Mock Exams
                      </span>
                      {course.hasPe && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-cyan-50 text-cyan-700 border border-cyan-200">
                          ✓ PE Practice
                        </span>
                      )}
                      {course.hasCheatSheet && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                          ✓ CheatSheet
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Footer Button */}
                  <button
                    onClick={() => navigate('/auth')}
                    className="w-full py-2.5 rounded-xl text-xs font-bold text-blue-700 bg-blue-50/70 border border-blue-200/80 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all flex items-center justify-center gap-1.5 cursor-pointer group-hover:shadow-md"
                  >
                    <span>Access Complete Pack</span>
                    <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-0.5" />
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
