"use client";

import { useState, useEffect } from 'react';
import { Sun, Moon, LogOut, ShieldAlert, X, ChevronRight, GraduationCap } from 'lucide-react';

export default function GradePortal() {
    const [creds, setCreds] = useState({ id: "", pw: "" });
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');
    const [modal, setModal] = useState<{ show: boolean, msg: string }>({ show: false, msg: "" });
    
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
                showError("Invalid Student ID or Password. Please try again.");
            }
        } catch (e) {
            showError("Error during authentication. Please try again later.");
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
            
            const sorted = [...list].sort((a, b) => (b.academicYearFrom || 0) - (a.academicYearFrom || 0));
            setGrades(sorted);
            if (sorted.length > 0) setViewing(sorted[0]);
        } catch (e) {
            showError("Failed to decrypt grade records. The session may have timed out.");
        } finally {
            setGradesLoading(false);
        }
    };

    const themeClass = theme === 'dark' 
        ? "bg-[#0d1117] text-gray-300" 
        : "bg-gray-50 text-gray-800";
    
    const cardClass = theme === 'dark'
        ? "bg-[#161b22] border-[#30363d]"
        : "bg-white border-gray-200 shadow-sm";

    if (!data) {
        return (
            <div className={`flex items-center justify-center min-h-screen p-4 transition-colors duration-300 ${themeClass}`}>
                {modal.show && <ErrorModal msg={modal.msg} onClose={() => setModal({ show: false, msg: "" })} theme={theme} />}

                <div className={`w-full max-w-sm p-8 border rounded-2xl shadow-2xl transition-colors ${cardClass}`}>
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-2">
                            <GraduationCap className="text-blue-500" />
                            <h1 className="text-xl font-black tracking-tighter italic">WILDCAT TUNNEL</h1>
                        </div>
                        <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-500/10">
                            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                    </div>
                    
                    <div className="space-y-4">
                        <input className={`w-full border p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 transition-all ${theme === 'dark' ? 'bg-[#0d1117] border-[#30363d]' : 'bg-white border-gray-300'}`} 
                               placeholder="Student ID" value={creds.id} onChange={e => setCreds({...creds, id: e.target.value})} />
                        <input className={`w-full border p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 transition-all ${theme === 'dark' ? 'bg-[#0d1117] border-[#30363d]' : 'bg-white border-gray-300'}`} 
                               placeholder="Password" type="password" value={creds.pw} onChange={e => setCreds({...creds, pw: e.target.value})} />
                        <button onClick={startAuth} disabled={authLoading} className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-xl text-white font-bold transition-all disabled:opacity-50">
                            {authLoading ? "Signing In..." : "Sign In"}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen p-4 md:p-8 transition-colors duration-300 ${themeClass}`}>
             {modal.show && <ErrorModal msg={modal.msg} onClose={() => setModal({ show: false, msg: "" })} theme={theme} />}

            <div className="max-w-6xl mx-auto">
                <header className={`flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 p-6 rounded-2xl border ${cardClass}`}>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-black">
                            {data.userInfo?.fullName?.charAt(0)}
                        </div>
                        <div>
                            <h2 className="text-xl font-black tracking-tight">{data.userInfo?.fullName || "Student"}</h2>
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

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    <aside className="space-y-3">
                        <h3 className="text-[10px] font-bold opacity-50 uppercase tracking-widest mb-4">Academic History</h3>
                        {gradesLoading ? (
                            [1, 2, 3].map(i => <div key={i} className={`h-20 rounded-xl animate-pulse ${theme === 'dark' ? 'bg-[#161b22]' : 'bg-gray-200'}`} />)
                        ) : (
                            grades?.map((en, i) => (
                                <div key={i} onClick={() => setViewing(en)} 
                                     className={`p-4 rounded-xl cursor-pointer border transition-all duration-200 flex justify-between items-center ${viewing === en ? 'bg-blue-600 border-blue-400 text-white shadow-lg' : cardClass + ' hover:border-blue-500/50'}`}>
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
                            <div className={`border rounded-2xl overflow-hidden shadow-xl ${cardClass}`}>
                                <div className="p-6 border-b flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-500/5 border-inherit">
                                    <h3 className="text-sm font-black uppercase tracking-wider">{viewing.academicYear} — {viewing.term?.toUpperCase()}</h3>
                                    <div className="flex gap-4 text-[10px] font-mono">
                                        <div className="px-3 py-1 rounded-full border border-green-500/30 text-green-500 bg-green-500/5">GWA: {viewing.gwa}</div>
                                        <div className="px-3 py-1 rounded-full border border-blue-500/30 text-blue-500 bg-blue-500/5">Units: {viewing.totalUnits}</div>
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead className={`text-[10px] uppercase font-bold ${theme === 'dark' ? 'bg-black/20' : 'bg-gray-100'}`}>
                                            <tr>
                                                <th className="px-6 py-4">Code</th>
                                                <th className="px-6 py-4">Subject</th>
                                                <th className="px-6 py-4 text-center">Units</th>
                                                <th className="px-6 py-4 text-center text-blue-500">Midterm</th>
                                                <th className="px-6 py-4 text-center text-green-600">Final</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-inherit">
                                            {viewing.enrolledCourseGradeDetails?.map((c: any, i: number) => {
                                                const midtermEntry = c.gradeDetails?.find((g: any) => g.periodName === "Midterm");
                                                const midtermGrade = midtermEntry?.grade || "-";

                                                return (
                                                    <tr key={i} className="hover:bg-gray-500/5 transition-colors">
                                                        <td className="px-6 py-4 font-mono text-blue-500 text-[10px] font-bold">{c.courseCode}</td>
                                                        <td className="px-6 py-4 text-xs font-medium">{c.courseTitle}</td>
                                                        <td className="px-6 py-4 text-center text-[10px] opacity-50">{c.units}</td>
                                                        <td className="px-6 py-4 text-center">
                                                            <span className="font-mono text-xs font-bold">
                                                                {midtermGrade}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <span className={`px-2 py-1 rounded text-[10px] font-black ${c.gradeDetailFinal?.grade === '5.0' ? 'text-red-500 bg-red-500/10' : 'text-green-500 bg-green-500/10'}`}>
                                                                {c.gradeDetailFinal?.grade || "-"}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <div className={`h-64 flex flex-col items-center justify-center border-2 border-dashed rounded-2xl opacity-40 ${theme === 'dark' ? 'border-[#30363d]' : 'border-gray-300'}`}>
                                <span className="text-[10px] uppercase tracking-widest">Select a semester index</span>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
}

function ErrorModal({ msg, onClose, theme }: { msg: string, onClose: () => void, theme: string }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className={`w-full max-w-md p-6 rounded-2xl border shadow-2xl animate-in zoom-in-95 duration-200 ${theme === 'dark' ? 'bg-[#1c2128] border-red-900/30' : 'bg-white border-red-200'}`}>
                <div className="flex items-center gap-3 text-red-500 mb-4">
                    <ShieldAlert size={24} />
                    <h2 className="font-black tracking-tight">Error</h2>
                </div>
                <p className={`text-sm leading-relaxed mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{msg}</p>
                <button onClick={onClose} className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-red-900/20 uppercase text-xs tracking-widest">
                    Okay
                </button>
            </div>
        </div>
    );
}