import React from 'react';
import { Award, BookOpen, GraduationCap, School, X } from 'lucide-react';

interface DeveloperProfileModalProps {
  onClose: () => void;
}

export const DeveloperProfileModal: React.FC<DeveloperProfileModalProps> = ({ onClose }) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h2 className="text-lg font-bold text-white">Profil Pengembang</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Tutup Profil Pengembang"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 md:p-7 space-y-6">
          {/* Identity Block */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center shrink-0">
              <span className="text-2xl font-extrabold text-emerald-400 font-display">AL</span>
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-white leading-snug">
                Akum Laksana, S.Pd., M.Pd.
              </h3>
              <p className="text-sm font-semibold text-emerald-400 mt-0.5">
                Guru IPA · SMP Negeri Perisai
              </p>
            </div>
          </div>

          {/* Role & Curriculum Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 mb-1">
                <School className="w-4 h-4" />
                <span>Instansi</span>
              </div>
              <div className="text-sm font-semibold text-white">SMP Negeri Perisai</div>
              <div className="text-xs text-slate-400 mt-0.5">Mata Pelajaran Ilmu Pengetahuan Alam</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 mb-1">
                <GraduationCap className="w-4 h-4" />
                <span>Kualifikasi Akademik</span>
              </div>
              <div className="text-sm font-semibold text-white">S.Pd., M.Pd.</div>
              <div className="text-xs text-slate-400 mt-0.5">Pendidik &amp; Pengembang Media IPA</div>
            </div>
          </div>

          {/* Description */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <span>Tentang Media Pembelajaran Ini</span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              Game edukasi <strong>Petualangan Mario: Penyelamat Pangan Sehat</strong> dikembangkan oleh{' '}
              <strong>Akum Laksana, S.Pd., M.Pd.</strong> sebagai media pembelajaran interaktif IPA SMP kelas VIII untuk materi{' '}
              <strong>Zat Aditif dan Zat Adiktif</strong>.
            </p>
            <p className="text-xs text-slate-400 leading-relaxed">
              Melalui petualangan mengumpulkan zat alami yang aman, menghindari bahan kimia berbahaya, mini-game uji pangan, serta pertempuran melawan Bos Zat Adiktif, siswa diharapkan mampu menerapkan pola hidup sehat dan kritis memilih pangan aman.
            </p>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Inovasi Pembelajaran IPA SMP Negeri Perisai</span>
            </div>
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
