// Mock data for all AsS screens

export interface Course {
    readonly id: string;
    readonly name: string;
    readonly instructor: string;
    readonly color: string;
    readonly assignments: number;
    readonly quizzes: number;
    readonly materials: number;
    readonly progress: number;
}

export interface Task {
    readonly id: string;
    readonly title: string;
    readonly courseId: string;
    readonly courseName: string;
    readonly courseColor: string;
    readonly dueDate: string;
    readonly countdown: string;
    readonly urgency: 'critical' | 'approaching' | 'ontrack';
    readonly completed: boolean;
    readonly materials: string[];
}

export interface TimelineEvent {
    readonly id: string;
    readonly title: string;
    readonly type: 'exam' | 'assignment' | 'quiz';
    readonly courseColor: string;
    readonly courseName: string;
    readonly date: string;
    readonly countdown: string;
}

export interface Notification {
    readonly id: string;
    readonly title: string;
    readonly courseName: string;
    readonly courseColor: string;
    readonly countdown: string;
    readonly urgency: 'critical' | 'approaching' | 'ontrack';
    readonly channel: 'push' | 'email' | 'sms';
    readonly time: string;
    readonly sent: boolean;
}

export interface StudyMaterial {
    readonly id: string;
    readonly name: string;
    readonly type: 'pdf' | 'ppt' | 'doc' | 'slides' | 'link';
    readonly courseName: string;
    readonly courseColor: string;
    readonly pages: number;
    readonly uploadDate: string;
    readonly size: string;
}

export interface VideoContent {
    readonly id: string;
    readonly title: string;
    readonly sourceMaterial: string;
    readonly duration: string;
    readonly createdDate: string;
    readonly thumbnail: string;
}

export interface SyllabusTopic {
    readonly id: string;
    readonly name: string;
    readonly coverage: 'covered' | 'partial' | 'uncovered';
    readonly materials: { name: string; pages: string; type: string }[];
    readonly animated: boolean;
}

export interface AssignmentQuestion {
    readonly id: string;
    readonly number: number;
    readonly text: string;
    readonly topicId: string;
    readonly topicName: string;
    readonly marks: number;
    readonly materials: { name: string; pages: string; type: string }[];
    readonly contentGenerated: boolean;
    readonly difficulty: 'easy' | 'medium' | 'hard';
}

export interface Assessment {
    readonly id: string;
    readonly name: string;
    readonly type: 'exam' | 'quiz' | 'assignment';
    readonly courseName: string;
    readonly courseColor: string;
    readonly dueDate: string;
    readonly countdown: string;
    readonly coveragePercent: number;
    readonly topics: SyllabusTopic[];
    readonly questions?: AssignmentQuestion[];
}

export const courses: Course[] = [
    { id: '1', name: 'Organic Chemistry', instructor: 'Dr. Sarah Mitchell', color: '#06B6D4', assignments: 8, quizzes: 5, materials: 24, progress: 72 },
    { id: '2', name: 'Linear Algebra', instructor: 'Prof. James Chen', color: '#7C3AED', assignments: 6, quizzes: 4, materials: 18, progress: 85 },
    { id: '3', name: 'Macroeconomics', instructor: 'Dr. Emily Rodriguez', color: '#F59E0B', assignments: 10, quizzes: 6, materials: 32, progress: 60 },
    { id: '4', name: 'Data Structures', instructor: 'Prof. Alex Kumar', color: '#10B981', assignments: 12, quizzes: 8, materials: 28, progress: 90 },
    { id: '5', name: 'World History', instructor: 'Dr. Maria Thompson', color: '#FF4D6A', assignments: 5, quizzes: 3, materials: 15, progress: 45 },
    { id: '6', name: 'Physics II', instructor: 'Prof. David Park', color: '#3B82F6', assignments: 7, quizzes: 5, materials: 20, progress: 68 },
];

export const tasks: Task[] = [
    { id: '1', title: 'Organic Chemistry Lab Report', courseId: '1', courseName: 'Organic Chemistry', courseColor: '#06B6D4', dueDate: '2026-03-01', countdown: '1d 14h', urgency: 'critical', completed: false, materials: ['Lecture 5 Slides (pp. 12-18)', 'Lab Manual Ch.3'] },
    { id: '2', title: 'Macroeconomics Quiz Prep', courseId: '3', courseName: 'Macroeconomics', courseColor: '#F59E0B', dueDate: '2026-03-02', countdown: '2d 8h', urgency: 'approaching', completed: false, materials: ['Chapter 7 Notes', 'Practice Problems Set 4'] },
    { id: '3', title: 'Linear Algebra Problem Set 6', courseId: '2', courseName: 'Linear Algebra', courseColor: '#7C3AED', dueDate: '2026-03-04', countdown: '4d 12h', urgency: 'ontrack', completed: false, materials: ['Eigenvalues Lecture Notes'] },
    { id: '4', title: 'Data Structures Assignment 8', courseId: '4', courseName: 'Data Structures', courseColor: '#10B981', dueDate: '2026-03-05', countdown: '5d 6h', urgency: 'ontrack', completed: true, materials: ['BST Implementation Guide'] },
    { id: '5', title: 'Physics II Lab Worksheet', courseId: '6', courseName: 'Physics II', courseColor: '#3B82F6', dueDate: '2026-03-01', countdown: '1d 20h', urgency: 'critical', completed: false, materials: ['Electromagnetic Waves Ch.12'] },
    { id: '6', title: 'World History Essay Draft', courseId: '5', courseName: 'World History', courseColor: '#FF4D6A', dueDate: '2026-03-03', countdown: '3d 10h', urgency: 'approaching', completed: false, materials: ['Renaissance Period Notes', 'Source Documents Pack'] },
];

export const timelineEvents: TimelineEvent[] = [
    { id: '1', title: 'Organic Chem Lab Report', type: 'assignment', courseColor: '#06B6D4', courseName: 'Organic Chemistry', date: 'Mar 1', countdown: '1d 14h' },
    { id: '2', title: 'Physics II Lab', type: 'assignment', courseColor: '#3B82F6', courseName: 'Physics II', date: 'Mar 1', countdown: '1d 20h' },
    { id: '3', title: 'Macro Quiz Ch.7', type: 'quiz', courseColor: '#F59E0B', courseName: 'Macroeconomics', date: 'Mar 2', countdown: '2d 8h' },
    { id: '4', title: 'History Essay', type: 'assignment', courseColor: '#FF4D6A', courseName: 'World History', date: 'Mar 3', countdown: '3d 10h' },
    { id: '5', title: 'Lin. Algebra PS6', type: 'assignment', courseColor: '#7C3AED', courseName: 'Linear Algebra', date: 'Mar 4', countdown: '4d 12h' },
    { id: '6', title: 'DSA Midterm', type: 'exam', courseColor: '#10B981', courseName: 'Data Structures', date: 'Mar 5', countdown: '5d 6h' },
    { id: '7', title: 'Organic Chem Midterm', type: 'exam', courseColor: '#06B6D4', courseName: 'Organic Chemistry', date: 'Mar 7', countdown: '7d 0h' },
];

export const notifications: Notification[] = [
    { id: '1', title: 'Organic Chem Lab Report', courseName: 'Organic Chemistry', courseColor: '#06B6D4', countdown: '1d 14h', urgency: 'critical', channel: 'push', time: '2 days before', sent: true },
    { id: '2', title: 'Organic Chem Lab Report', courseName: 'Organic Chemistry', courseColor: '#06B6D4', countdown: '1d 14h', urgency: 'critical', channel: 'email', time: '1 day before', sent: true },
    { id: '3', title: 'Organic Chem Lab Report', courseName: 'Organic Chemistry', courseColor: '#06B6D4', countdown: '14h', urgency: 'critical', channel: 'push', time: '12 hours', sent: false },
    { id: '4', title: 'Macroeconomics Quiz', courseName: 'Macroeconomics', courseColor: '#F59E0B', countdown: '2d 8h', urgency: 'approaching', channel: 'push', time: '2 days before', sent: true },
    { id: '5', title: 'Physics II Lab', courseName: 'Physics II', courseColor: '#3B82F6', countdown: '1d 20h', urgency: 'critical', channel: 'push', time: '2 days before', sent: true },
];

export const studyMaterials: StudyMaterial[] = [
    { id: '1', name: 'Stereochemistry Lecture Slides', type: 'slides', courseName: 'Organic Chemistry', courseColor: '#06B6D4', pages: 32, uploadDate: 'Feb 20', size: '4.2 MB' },
    { id: '2', name: 'Reaction Mechanisms PDF', type: 'pdf', courseName: 'Organic Chemistry', courseColor: '#06B6D4', pages: 18, uploadDate: 'Feb 22', size: '2.8 MB' },
    { id: '3', name: 'Eigenvalues & Eigenvectors', type: 'ppt', courseName: 'Linear Algebra', courseColor: '#7C3AED', pages: 45, uploadDate: 'Feb 18', size: '6.1 MB' },
    { id: '4', name: 'GDP & Fiscal Policy Notes', type: 'pdf', courseName: 'Macroeconomics', courseColor: '#F59E0B', pages: 24, uploadDate: 'Feb 25', size: '1.9 MB' },
    { id: '5', name: 'Binary Search Trees Guide', type: 'doc', courseName: 'Data Structures', courseColor: '#10B981', pages: 15, uploadDate: 'Feb 15', size: '1.2 MB' },
    { id: '6', name: 'Electromagnetic Waves Ch.12', type: 'pdf', courseName: 'Physics II', courseColor: '#3B82F6', pages: 28, uploadDate: 'Feb 24', size: '3.5 MB' },
];

export const videoContent: VideoContent[] = [
    { id: '1', title: 'Stereochemistry Fundamentals', sourceMaterial: 'Lecture 5 Slides', duration: '04:32', createdDate: 'Feb 26', thumbnail: '' },
    { id: '2', title: 'Matrix Transformations Explained', sourceMaterial: 'Eigenvalues PPT', duration: '06:15', createdDate: 'Feb 25', thumbnail: '' },
    { id: '3', title: 'Supply & Demand Curves', sourceMaterial: 'GDP Notes', duration: '03:48', createdDate: 'Feb 24', thumbnail: '' },
    { id: '4', title: 'BST Operations Walkthrough', sourceMaterial: 'BST Guide', duration: '08:20', createdDate: 'Feb 23', thumbnail: '' },
];

export const assessments: Assessment[] = [
    {
        id: '1', name: 'Midterm Exam', type: 'exam', courseName: 'Organic Chemistry', courseColor: '#06B6D4', dueDate: 'Mar 7', countdown: '7d 0h', coveragePercent: 78,
        topics: [
            { id: 't1', name: 'Chapter 3: Stereochemistry', coverage: 'covered', materials: [{ name: 'Lecture 5 Slides', pages: 'pp. 12-18', type: 'slides' }, { name: 'Stereochemistry Notes', pages: 'pp. 4-9', type: 'pdf' }], animated: true },
            { id: 't2', name: 'Chapter 4: Reaction Mechanisms', coverage: 'partial', materials: [{ name: 'Reaction Mechanisms PDF', pages: 'pp. 1-8', type: 'pdf' }], animated: false },
            { id: 't3', name: 'Chapter 5: Alkene Reactions', coverage: 'uncovered', materials: [], animated: false },
            { id: 't4', name: 'Chapter 2: Molecular Orbitals', coverage: 'covered', materials: [{ name: 'Lecture 3 Slides', pages: 'pp. 5-22', type: 'slides' }, { name: 'MO Theory PDF', pages: 'pp. 1-12', type: 'pdf' }], animated: true },
        ]
    },
    {
        id: '2', name: 'Quiz 5: Fiscal Policy', type: 'quiz', courseName: 'Macroeconomics', courseColor: '#F59E0B', dueDate: 'Mar 2', countdown: '2d 8h', coveragePercent: 65,
        topics: [
            { id: 't5', name: 'Government Spending Models', coverage: 'covered', materials: [{ name: 'GDP Notes', pages: 'pp. 8-14', type: 'pdf' }], animated: false },
            { id: 't6', name: 'Tax Policy & Multipliers', coverage: 'partial', materials: [{ name: 'GDP Notes', pages: 'pp. 15-20', type: 'pdf' }], animated: false },
            { id: 't7', name: 'Central Bank Operations', coverage: 'uncovered', materials: [], animated: false },
        ]
    },
    {
        id: '3', name: 'Problem Set 6', type: 'assignment', courseName: 'Linear Algebra', courseColor: '#7C3AED', dueDate: 'Mar 4', countdown: '4d 12h', coveragePercent: 90,
        topics: [
            { id: 't8', name: 'Eigenvalues & Eigenvectors', coverage: 'covered', materials: [{ name: 'Eigenvalues PPT', pages: 'pp. 1-25', type: 'ppt' }], animated: true },
            { id: 't9', name: 'Diagonalization', coverage: 'partial', materials: [{ name: 'Eigenvalues PPT', pages: 'pp. 26-40', type: 'ppt' }], animated: false },
        ],
        questions: [
            { id: 'q1', number: 1, text: 'Find the eigenvalues of the matrix A = [[3,1],[0,2]]', topicId: 't8', topicName: 'Eigenvalues & Eigenvectors', marks: 10, materials: [{ name: 'Eigenvalues PPT', pages: 'pp. 5-8', type: 'ppt' }], contentGenerated: true, difficulty: 'easy' },
            { id: 'q2', number: 2, text: 'Determine the eigenvectors corresponding to each eigenvalue of A', topicId: 't8', topicName: 'Eigenvalues & Eigenvectors', marks: 15, materials: [{ name: 'Eigenvalues PPT', pages: 'pp. 9-14', type: 'ppt' }], contentGenerated: true, difficulty: 'medium' },
            { id: 'q3', number: 3, text: 'Is matrix A diagonalizable? If yes, find P and D such that A = PDP^-1', topicId: 't9', topicName: 'Diagonalization', marks: 20, materials: [{ name: 'Eigenvalues PPT', pages: 'pp. 28-35', type: 'ppt' }], contentGenerated: false, difficulty: 'hard' },
            { id: 'q4', number: 4, text: 'Compute A^10 using diagonalization', topicId: 't9', topicName: 'Diagonalization', marks: 15, materials: [{ name: 'Eigenvalues PPT', pages: 'pp. 36-40', type: 'ppt' }], contentGenerated: false, difficulty: 'hard' },
            { id: 'q5', number: 5, text: 'Prove that eigenvectors corresponding to distinct eigenvalues are linearly independent', topicId: 't8', topicName: 'Eigenvalues & Eigenvectors', marks: 20, materials: [{ name: 'Eigenvalues PPT', pages: 'pp. 15-20', type: 'ppt' }], contentGenerated: false, difficulty: 'hard' },
        ]
    },
    {
        id: '4', name: 'Lab Report: Stereoisomers', type: 'assignment', courseName: 'Organic Chemistry', courseColor: '#06B6D4', dueDate: 'Mar 1', countdown: '1d 14h', coveragePercent: 60,
        topics: [
            { id: 't10', name: 'Chirality & Optical Activity', coverage: 'covered', materials: [{ name: 'Lecture 5 Slides', pages: 'pp. 1-11', type: 'slides' }], animated: true },
            { id: 't11', name: 'R/S Configuration', coverage: 'partial', materials: [{ name: 'Stereochemistry Notes', pages: 'pp. 10-15', type: 'pdf' }], animated: false },
            { id: 't12', name: 'Meso Compounds', coverage: 'uncovered', materials: [], animated: false },
        ],
        questions: [
            { id: 'q6', number: 1, text: 'Draw all stereoisomers of 2,3-dibromobutane and label each as R or S', topicId: 't11', topicName: 'R/S Configuration', marks: 10, materials: [{ name: 'Stereochemistry Notes', pages: 'pp. 10-12', type: 'pdf' }], contentGenerated: false, difficulty: 'medium' },
            { id: 'q7', number: 2, text: 'Identify which stereoisomers are meso compounds and explain why', topicId: 't12', topicName: 'Meso Compounds', marks: 15, materials: [], contentGenerated: false, difficulty: 'medium' },
            { id: 'q8', number: 3, text: 'Predict the optical activity of each stereoisomer from Q1. Justify with specific rotation data', topicId: 't10', topicName: 'Chirality & Optical Activity', marks: 15, materials: [{ name: 'Lecture 5 Slides', pages: 'pp. 6-9', type: 'slides' }], contentGenerated: true, difficulty: 'hard' },
            { id: 'q9', number: 4, text: 'Design an experiment to separate a racemic mixture of 2-bromobutane', topicId: 't10', topicName: 'Chirality & Optical Activity', marks: 20, materials: [{ name: 'Lecture 5 Slides', pages: 'pp. 10-11', type: 'slides' }, { name: 'Lab Manual', pages: 'pp. 45-52', type: 'pdf' }], contentGenerated: false, difficulty: 'hard' },
        ]
    },
];

export const dashboardStats = {
    coursesSynced: 6,
    upcomingDeadlines: 8,
    tasksCompleted: 85,
    aiContentReady: 12,
};

export const navItems = [
    { label: 'Dashboard', path: '/' },
    { label: 'Courses', path: '/courses' },
    { label: 'Schedule', path: '/schedule' },
    { label: 'AI Studio', path: '/ai-studio' },
    { label: 'Notifications', path: '/notifications' },
    { label: 'Syllabus Map', path: '/syllabus-map' },
];
