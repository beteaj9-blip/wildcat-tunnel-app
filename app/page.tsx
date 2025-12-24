"use client";

import { useState } from 'react';
import { Sun, Moon, LogOut, ShieldAlert, ChevronRight, GraduationCap, Award, Star, CheckCircle2, XCircle, HelpCircle, Info, ShieldCheck } from 'lucide-react';

export default function GradePortal() {
    const [creds, setCreds] = useState({ id: "", pw: "" });
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');
    const [modal, setModal] = useState<{ show: boolean, msg: string }>({ show: false, msg: "" });
    const [infoModal, setInfoModal] = useState<{ show: boolean, type: 'deans' | 'parangal' | null }>({ show: false, type: null });
    
    const [authLoading, setAuthLoading] = useState(false);
    const [gradesLoading, setGradesLoading] = useState(false);
    const [data, setData] = useState<any>(null);
    const [grades, setGrades] = useState<any[]>([]);
    const [viewing, setViewing] = useState<any>(null);

    const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    const showError = (msg: string) => setModal({ show: true, msg });

    const startAuth = async () => {
        setAuthLoading(true);
        try {
            const loginRes = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studentId: creds.id, password: creds.pw })
            });
            const auth = await loginRes.json();
            if (auth?.token) {
                setData(auth);
                await fetchGrades(auth.token);
            } else {
                showError("Invalid Student ID or Password.");
            }
        } catch (e) {
            showError("Error during authentication.");
        } finally {
            setAuthLoading(false);
        }
    };

    const fetchGrades = async (token: string) => {
        setGradesLoading(true);
        try {
            const gradeRes = await fetch('/api/grade', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const gradeData = await gradeRes.json();
            const list = gradeData?.items?.studentEnrollments || [];
            const sorted = [...list].sort((a, b) => (b.idStudentEnrollment || 0) - (a.idStudentEnrollment || 0));
            setGrades(sorted);
            if (sorted.length > 0) setViewing(sorted[0]);
        } catch (e) {
            showError("Failed to fetch records.");
        } finally {
            setGradesLoading(false);
        }
    };

    const DEANS_THRESHOLD = 4.25;
    const PARANGAL_THRESHOLD = 4.4;

    const isDeansList = viewing?.gwa >= DEANS_THRESHOLD;

    const getParangalData = () => {
        if (!viewing || grades.length === 0) return { eligible: false, basis: [] };

        const currentYear = viewing.academicYear;
        const currentTerm = viewing.term;
        const isFirstYear = viewing.yearLevel === "First Year";

        let basis: any[] = [];

        if (isFirstYear && currentTerm === "First Semester") {
            basis = [{ year: currentYear, term: "First Semester", gwa: viewing.gwa }];
        } else if (currentTerm === "First Semester") {
            const yearParts = currentYear.split(' - ');
            const prevYearStr = `${parseInt(yearParts[0]) - 1} - ${yearParts[0]}`;
            const prev2ndSem = grades.find(g => g.academicYear === prevYearStr && g.term === "Second Semester");
            
            basis = [
                { year: currentYear, term: "First Semester", gwa: viewing.gwa },
                ...(prev2ndSem ? [{ year: prevYearStr, term: "Second Semester", gwa: prev2ndSem.gwa }] : [])
            ];
        } else {
            const yearParts = currentYear.split(' - ');
            const nextYearStr = `${parseInt(yearParts[0]) + 1} - ${parseInt(yearParts[1]) + 1}`;
            const next1stSem = grades.find(g => g.academicYear === nextYearStr && g.term === "First Semester");
            
            basis = [
                { year: currentYear, term: "Second Semester", gwa: viewing.gwa },
                ...(next1stSem ? [{ year: nextYearStr, term: "First Semester", gwa: next1stSem.gwa }] : [])
            ];
        }

        const eligible = basis.length > 0 && basis.every(b => b.gwa >= PARANGAL_THRESHOLD);
        return { eligible, basis };
    };

    const parangalInfo = getParangalData();

    const themeClass = theme === 'dark' ? "bg-[#0d1117] text-gray-300" : "bg-gray-50 text-gray-800";
    const cardClass = theme === 'dark' ? "bg-[#161b22] border-[#30363d]" : "bg-white border-gray-200 shadow-sm";

    if (!data) {
        return (
            <div className={`flex items-center justify-center min-h-screen p-4 ${themeClass}`}>
                <div className={`w-full max-w-sm p-8 border rounded-2xl shadow-2xl ${cardClass}`}>
                    <div className="flex justify-between items-center mb-6 text-blue-500">
                        <div className="flex items-center gap-2">
                            <GraduationCap />
                            <h1 className="text-xl font-black tracking-tighter italic uppercase">Wildcat Tunnel</h1>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <input className={`w-full border p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 ${theme === 'dark' ? 'bg-[#0d1117] border-[#30363d]' : 'bg-white border-gray-300'}`} 
                               placeholder="Student ID" value={creds.id} onChange={e => setCreds({...creds, id: e.target.value})} />
                        <input className={`w-full border p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 ${theme === 'dark' ? 'bg-[#0d1117] border-[#30363d]' : 'bg-white border-gray-300'}`} 
                               placeholder="Password" type="password" value={creds.pw} onChange={e => setCreds({...creds, pw: e.target.value})} />
                        <button onClick={startAuth} disabled={authLoading} className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-xl text-white font-bold disabled:opacity-50">
                            {authLoading ? "Signing In..." : "Sign In"}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen p-4 md:p-8 ${themeClass}`}>
            {modal.show && <ErrorModal msg={modal.msg} onClose={() => setModal({ show: false, msg: "" })} theme={theme} />}
            {infoModal.show && (
                <InfoWindow 
                    type={infoModal.type} 
                    onClose={() => setInfoModal({ show: false, type: null })} 
                    theme={theme}
                    thresholds={{ deans: DEANS_THRESHOLD, parangal: PARANGAL_THRESHOLD }}
                    parangalBasis={parangalInfo.basis}
                    currentViewingGwa={viewing.gwa}
                    viewingTerm={viewing.term}
                />
            )}

            <div className="max-w-6xl mx-auto">
                <header className={`flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4 p-6 rounded-2xl border ${cardClass}`}>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-900/40">
                            {data.userInfo?.fullName?.charAt(0)}
                        </div>
                        <div>
                            <h2 className="text-xl font-black tracking-tight">{data.userInfo?.fullName}</h2>
                            <div className="flex gap-3 text-[10px] font-mono mt-1">
                                <span className="opacity-50">ID: {data.userInfo?.studentId}</span>
                                <span className="text-green-500 font-bold">● ONLINE</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={toggleTheme} className="p-2 rounded-lg border border-gray-500/20 hover:bg-gray-500/10 transition-all">
                            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                        <button onClick={() => window.location.reload()} className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-red-500 border border-red-500/20 rounded-lg hover:bg-red-500 hover:text-white transition-all">
                            <LogOut size={14} /> LOGOUT
                        </button>
                    </div>
                </header>

                <div className={`w-full mb-8 p-4 rounded-2xl border flex items-start gap-4 transition-all ${theme === 'dark' ? 'bg-amber-500/5 border-amber-500/20' : 'bg-amber-50 border-amber-200'}`}>
                    <div className="mt-0.5">
                        <ShieldCheck className={theme === 'dark' ? 'text-amber-500' : 'text-amber-600'} size={18} />
                    </div>
                    <div className="space-y-1">
                        <h4 className={`text-[10px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-amber-500' : 'text-amber-700'}`}>System Notice & Privacy Disclaimer</h4>
                        <p className={`text-xs font-bold leading-relaxed ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            This website serves as an <span className="text-blue-500">alternative frontend</span> for university grade viewing. We <span className="underline decoration-amber-500/50 underline-offset-4">do not store</span> any academic data, student IDs, or passwords on any external database. All information is fetched directly from the official WITS servers and exists only within your current session.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    <aside className="space-y-3">
                        <h3 className="text-[10px] font-bold opacity-50 uppercase tracking-widest mb-4">Academic History</h3>
                        {gradesLoading ? (
                            [1, 2, 3].map(i => <div key={i} className={`h-20 rounded-xl animate-pulse ${theme === 'dark' ? 'bg-[#161b22] border-[#30363d]' : 'bg-gray-200'}`} />)
                        ) : (
                            grades?.map((en, i) => (
                                <div key={i} onClick={() => setViewing(en)} 
                                     className={`p-4 rounded-xl cursor-pointer border flex justify-between items-center transition-all ${viewing === en ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-900/20' : cardClass + ' hover:border-blue-500/50'}`}>
                                    <div>
                                        <div className="font-bold text-xs">{en.academicYear}</div>
                                        <div className="text-[10px] opacity-60 uppercase font-black">{en.term}</div>
                                    </div>
                                    <ChevronRight size={14} className={viewing === en ? 'opacity-100' : 'opacity-20'} />
                                </div>
                            ))
                        )}
                    </aside>

                    <main className="lg:col-span-3">
                        {gradesLoading ? (
                            <div className={`h-96 border rounded-2xl flex items-center justify-center ${cardClass}`}>
                                <div className="text-center">
                                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                    <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest">Loading...</p>
                                </div>
                            </div>
                        ) : viewing ? (
                            <div className="space-y-4">
                                <div className="flex flex-wrap gap-3">
                                    {isDeansList && (
                                        <button 
                                            onClick={() => setInfoModal({ show: true, type: 'deans' })}
                                            className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-500 hover:bg-amber-500/20 transition-all group shadow-sm"
                                        >
                                            <Award size={16} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Dean's Lister</span>
                                            <HelpCircle size={12} className="opacity-40 group-hover:opacity-100" />
                                        </button>
                                    )}
                                    {parangalInfo.eligible && (
                                        <button 
                                            onClick={() => setInfoModal({ show: true, type: 'parangal' })}
                                            className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-500 hover:bg-purple-500/20 transition-all group shadow-sm"
                                        >
                                            <Star size={16} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Parangal Awardee</span>
                                            <HelpCircle size={12} className="opacity-40 group-hover:opacity-100" />
                                        </button>
                                    )}
                                </div>

                                <div className={`border rounded-2xl overflow-hidden shadow-2xl ${theme === 'dark' ? 'shadow-black/50' : 'shadow-gray-200'} ${cardClass}`}>
                                    <div className="p-6 border-b flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-500/5 border-[#30363d]/50">
                                        <div className="text-left">
                                            <h3 className="text-sm font-black uppercase tracking-wider">{viewing.academicYear}</h3>
                                            <p className="text-[10px] opacity-50 font-bold uppercase">{viewing.term}</p>
                                        </div>
                                        <div className="flex gap-4 text-[10px] font-mono">
                                            <div className="px-3 py-1 rounded-full border border-green-500/30 text-green-500 bg-green-500/5 font-bold">GWA: {viewing.gwa}</div>
                                            <div className="px-3 py-1 rounded-full border border-blue-500/30 text-blue-500 bg-blue-500/5 font-bold">Units: {viewing.totalUnits}</div>
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead className={`text-[10px] uppercase font-bold ${theme === 'dark' ? 'bg-black/20' : 'bg-gray-100'}`}>
                                                <tr className="border-b border-inherit">
                                                    <th className="px-6 py-4">Code</th>
                                                    <th className="px-6 py-4">Subject</th>
                                                    <th className="px-6 py-4 text-center">Units</th>
                                                    <th className="px-6 py-4 text-center text-blue-500">Midterm</th>
                                                    <th className="px-6 py-4 text-center text-green-600">Final</th>
                                                    <th className="px-6 py-4 text-center">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-inherit">
                                                {viewing.enrolledCourseGradeDetails?.map((c: any, i: number) => {
                                                    const midterm = c.gradeDetails?.find((g: any) => g.periodName === "Midterm")?.grade || "-";
                                                    const isPassed = c.remarks?.toUpperCase() === "PASSED";
                                                    const finalGrade = c.gradeDetailFinal?.grade;

                                                    return (
                                                        <tr key={i} className="hover:bg-gray-500/5 transition-colors">
                                                            <td className="px-6 py-4 font-mono text-blue-500 text-[10px] font-bold">{c.courseCode}</td>
                                                            <td className="px-6 py-4 text-xs font-medium leading-tight">{c.courseTitle}</td>
                                                            <td className="px-6 py-4 text-center text-[10px] opacity-50">{c.units}</td>
                                                            <td className="px-6 py-4 text-center font-mono text-xs">{midterm}</td>
                                                            <td className="px-6 py-4 text-center">
                                                                <span className={`px-2 py-1 rounded text-[10px] font-black ${finalGrade === '5.0' ? 'text-red-500 bg-red-500/10' : 'text-green-500 bg-green-500/10'}`}>
                                                                    {finalGrade || "-"}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 text-center">
                                                                {c.remarks ? (
                                                                    <div className={`flex items-center justify-center gap-1 text-[10px] font-black uppercase ${isPassed ? 'text-green-500' : 'text-red-500'}`}>
                                                                        {isPassed ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                                                                        {c.remarks}
                                                                    </div>
                                                                ) : <span className="opacity-20">-</span>}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className={`h-64 flex flex-col items-center justify-center border-2 border-dashed rounded-2xl opacity-40 ${theme === 'dark' ? 'border-[#30363d]' : 'border-gray-300'}`}>
                                <span className="text-[10px] uppercase tracking-widest">Select a semester</span>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
}

function InfoWindow({ type, onClose, theme, thresholds, parangalBasis, currentViewingGwa, viewingTerm }: { type: any, onClose: any, theme: string, thresholds: any, parangalBasis?: any[], currentViewingGwa: number, viewingTerm: string }) {
    const isDeans = type === 'deans';
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className={`w-full max-w-sm p-6 rounded-3xl border shadow-2xl animate-in zoom-in-95 duration-200 ${theme === 'dark' ? 'bg-[#1c2128] border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className={`flex items-center gap-3 mb-4 ${isDeans ? 'text-amber-500' : 'text-purple-500'}`}>
                    {isDeans ? <Award size={24} /> : <Star size={24} />}
                    <h2 className="font-black uppercase tracking-tight">{isDeans ? "Dean's List" : "Parangal Award"}</h2>
                </div>
                
                <div className="space-y-4 mb-6">
                    <div className="space-y-2">
                        <p className="text-[10px] uppercase font-bold opacity-50">Calculation Basis for this View:</p>
                        {isDeans ? (
                            <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 flex justify-between items-center">
                                <span className="text-[10px] font-bold">Current GWA</span>
                                <span className="font-black text-amber-500">{currentViewingGwa}</span>
                            </div>
                        ) : (
                            parangalBasis?.map((b, idx) => (
                                <div key={idx} className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/20 flex justify-between items-center">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black">{b.year}</span>
                                        <span className="text-[8px] opacity-50 uppercase">{b.term}</span>
                                    </div>
                                    <span className={`font-black ${b.gwa >= thresholds.parangal ? 'text-purple-500' : 'text-red-500'}`}>{b.gwa}</span>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="space-y-2 text-xs leading-relaxed opacity-80 border-t border-inherit pt-4">
                        {isDeans ? (
                            <p>Awarded to students with a GWA of <span className="font-bold">{thresholds.deans}+</span> in the semester currently being viewed.</p>
                        ) : (
                            <p>Awarded based on the <span className="font-bold">{thresholds.parangal}+</span> maintenance across the cycle the current view belongs to. For a {viewingTerm}, the basis is its corresponding First or Second semester pair.</p>
                        )}
                    </div>
                </div>

                <button onClick={onClose} className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl uppercase text-[10px] tracking-widest shadow-lg shadow-blue-900/20">
                    Close
                </button>
            </div>
        </div>
    );
}

function ErrorModal({ msg, onClose, theme }: { msg: string, onClose: () => void, theme: string }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className={`w-full max-md p-6 rounded-2xl border shadow-2xl ${theme === 'dark' ? 'bg-[#1c2128] border-red-900/30' : 'bg-white border-red-200'}`}>
                <div className="flex items-center gap-3 text-red-500 mb-4">
                    <ShieldAlert size={24} />
                    <h2 className="font-black tracking-tight uppercase text-sm">System Error</h2>
                </div>
                <p className="text-sm opacity-70 mb-6">{msg}</p>
                <button onClick={onClose} className="w-full py-3 bg-red-500 text-white font-bold rounded-xl uppercase text-xs tracking-widest">Dismiss</button>
            </div>
        </div>
    );
}