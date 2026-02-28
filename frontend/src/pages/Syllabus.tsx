import React, { useState, useEffect } from 'react';
import { BookOpen, Sparkles, FileText, Loader2, ChevronRight, CheckCircle2, Search, Filter } from 'lucide-react';
import { Card } from '../components/shared/Card';
import { Button } from '../components/shared/Button';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const Syllabus: React.FC = () => {
    const { userId } = useAuth();

    const [documents, setDocuments] = useState<any[]>([]);
    const [isFetchingDocs, setIsFetchingDocs] = useState(false);

    // Classroom Integration
    const [courses, setCourses] = useState<any[]>([]);
    const [selectedCourseId, setSelectedCourseId] = useState<string>(() => {
        return localStorage.getItem('ass_syllabus_selected_course') || 'all';
    });
    const [isProcessingFiles, setIsProcessingFiles] = useState(false);

    // Syllabus Mapping State
    const [syllabusText, setSyllabusText] = useState(() => {
        return localStorage.getItem('ass_syllabus_text') || '';
    });
    const [selectedDocId, setSelectedDocId] = useState<string>(() => {
        return localStorage.getItem('ass_syllabus_selected_doc') || '';
    });
    const [isMapping, setIsMapping] = useState(false);
    const [mappedResult, setMappedResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    // Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        const fetchInitialData = async () => {
            if (!userId) return;
            setIsFetchingDocs(true);
            try {
                const [docsRes, coursesRes] = await Promise.all([
                    api.getDocuments(userId),
                    api.getCourses(userId)
                ]);
                setDocuments(docsRes.documents || []);
                setCourses(coursesRes.courses || []);
            } catch (err) {
                console.error("Failed to fetch initial data", err);
            } finally {
                setIsFetchingDocs(false);
            }
        };
        fetchInitialData();
    }, [userId]);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;

        const checkStatus = async () => {
            if (!userId || selectedCourseId === 'all') {
                setIsProcessingFiles(false);
                return;
            }

            try {
                const res = await api.getProcessingStatus(userId, selectedCourseId);
                if (res.status === 'processing') {
                    setIsProcessingFiles(true);
                } else {
                    // If it just finished, refresh docs to get new embeddings
                    if (isProcessingFiles) {
                        const docsRes = await api.getDocuments(userId);
                        setDocuments(docsRes.documents || []);
                    }
                    setIsProcessingFiles(false);
                }
            } catch (err) {
                console.error("Status check failed", err);
            }
        };

        if (selectedCourseId !== 'all') {
            checkStatus();
            interval = setInterval(checkStatus, 3000);
        } else {
            setIsProcessingFiles(false);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [userId, selectedCourseId, isProcessingFiles]);

    const filteredDocs = documents.filter(doc =>
        selectedCourseId === 'all' || doc.course_id === selectedCourseId
    );

    useEffect(() => {
        localStorage.setItem('ass_syllabus_selected_course', selectedCourseId);
    }, [selectedCourseId]);

    useEffect(() => {
        localStorage.setItem('ass_syllabus_selected_doc', selectedDocId);
    }, [selectedDocId]);

    useEffect(() => {
        localStorage.setItem('ass_syllabus_text', syllabusText);
    }, [syllabusText]);

    const handleSearch = async () => {
        if (!searchQuery.trim() || !userId) return;
        setIsSearching(true);
        try {
            const res = await api.search(userId, searchQuery, 5);
            setSearchResults(res.results || []);
        } catch (err) {
            console.error("Search failed", err);
        } finally {
            setIsSearching(false);
        }
    };

    const handleGenerateMap = async () => {
        if (!syllabusText.trim()) {
            setError("Please enter your syllabus topics.");
            return;
        }

        try {
            setIsMapping(true);
            setError(null);

            const result = await api.mapSyllabus(
                userId!,
                selectedDocId || null,
                syllabusText,
                selectedCourseId === 'all' ? null : selectedCourseId
            );
            setMappedResult(result);

        } catch (err: any) {
            setError(err.message || "Failed to map syllabus");
        } finally {
            setIsMapping(false);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="font-[Outfit] text-3xl font-bold text-pure tracking-tight">
                    Syllabus <span className="text-transparent bg-clip-text bg-linear-to-r from-teal to-emerald">Mapper</span>
                </h1>
                <p className="text-silver mt-2 text-lg">
                    Cross-reference your syllabus with your uploaded study materials.
                </p>
            </div>

            
            {/* Quick Search Section */}
            <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="font-[Outfit] text-xl font-semibold text-pure flex items-center gap-2">
                            <Search size={22} className="text-teal" />
                            Deep Search & Context
                        </h3>
                        <p className="text-sm text-slate mt-1">Locate specific paragraphs or explanations across your course library.</p>
                    </div>
                </div>

                <div className="flex gap-4 mb-8">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate" size={18} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="Search for a concept (e.g. 'How does Backpropagation work?')..."
                            className="w-full bg-obsidian border border-edge rounded-xl pl-12 pr-4 py-3 text-pure focus:outline-none focus:border-teal/50 transition-all font-[Outfit]"
                        />
                    </div>
                    <Button variant="primary" onClick={handleSearch} disabled={isSearching || !searchQuery.trim()}>
                        {isSearching ? <Loader2 size={18} className="animate-spin" /> : 'Search Library'}
                    </Button>
                </div>

                {searchResults.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {searchResults.map((result, idx) => (
                            <div key={idx} className="p-4 rounded-xl border border-edge bg-elevated/30 hover:bg-elevated/50 transition-colors">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="p-1.5 rounded bg-teal/10 text-teal">
                                        <FileText size={16} />
                                    </div>
                                    <span className="text-sm font-medium text-pure truncate">{result.filename}</span>
                                    <span className="ml-auto text-[10px] font-mono text-emerald bg-emerald/10 px-1.5 py-0.5 rounded border border-emerald/20">
                                        Score: {(result.score * 100).toFixed(0)}%
                                    </span>
                                </div>
                                <p className="text-silver text-sm leading-relaxed line-clamp-4 italic">
                                    "...{result.content}..."
                                </p>
                                <div className="mt-4 flex items-center justify-between">
                                    <span className="text-xs text-slate">Match found in context segment</span>
                                    <a
                                        href={`http://localhost:8000/documents/download/${result.document_id}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-xs text-teal hover:underline flex items-center gap-1"
                                    >
                                        Open Document
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : searchQuery && !isSearching ? (
                    <div className="py-12 text-center">
                        <p className="text-slate">No direct context matches found for this query.</p>
                    </div>
                ) : null}
            </Card>
        </div>
    );
};

export default Syllabus;
