const mongoose = require('mongoose');
const User = require('./models/User');
const Attendance = require('./models/Attendance');
const Marks = require('./models/Marks');
const Fees = require('./models/Fees');
const Course = require('./models/Course');
const Timetable = require('./models/Timetable');
const crypto = require('crypto');

// Mock Data
const mockUsers = [
    {
        studentId: 'S1001',
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        role: 'student',
        phone: '+91-98765-43210',
        department: 'Computer Science',
    },
    {
        studentId: 'S1002',
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        password: 'mypassword',
        role: 'student',
        phone: '+91-98765-43211',
        department: 'Information Technology',
    },
    {
        email: 'admin@gmail.com',
        password: 'admin',
        role: 'admin',
        name: 'Administrator',
        phone: '0000000000',
        studentId: 'ADMIN' // Dummy ID
    },
];

const mockAttendance = [
    { studentId: 'S1001', subject: 'Mathematics', attendedClasses: 38, totalClasses: 40 },
    { studentId: 'S1001', subject: 'Physics', attendedClasses: 34, totalClasses: 40 },
    { studentId: 'S1001', subject: 'Computer Science', attendedClasses: 32, totalClasses: 40 },
    { studentId: 'S1002', subject: 'Mathematics', attendedClasses: 30, totalClasses: 40 },
    { studentId: 'S1002', subject: 'Physics', attendedClasses: 28, totalClasses: 40 },
    { studentId: 'S1002', subject: 'Computer Science', attendedClasses: 36, totalClasses: 40 },
];

const mockMarks = [
    { studentId: 'S1001', semester: 1, subject: 'Mathematics I', internalMarks: 25, externalMarks: 60, total: 85, grade: 'A' },
    { studentId: 'S1001', semester: 1, subject: 'Physics I', internalMarks: 22, externalMarks: 58, total: 80, grade: 'A' },
    { studentId: 'S1001', semester: 1, subject: 'Programming Fundamentals', internalMarks: 28, externalMarks: 62, total: 90, grade: 'O' },
    { studentId: 'S1002', semester: 1, subject: 'Mathematics I', internalMarks: 20, externalMarks: 50, total: 70, grade: 'B' },
    { studentId: 'S1002', semester: 1, subject: 'Physics I', internalMarks: 18, externalMarks: 48, total: 66, grade: 'B' },
    { studentId: 'S1002', semester: 1, subject: 'Programming Fundamentals', internalMarks: 24, externalMarks: 55, total: 79, grade: 'B+' },
];

const mockFees = [
    { studentId: 'S1001', semester: 1, amount: 50000, status: 'Paid', dueDate: new Date('2025-01-15') },
    { studentId: 'S1001', semester: 2, amount: 52000, status: 'Pending', dueDate: new Date('2025-06-15') },
    { studentId: 'S1002', semester: 1, amount: 50000, status: 'Paid', dueDate: new Date('2025-01-15') },
    { studentId: 'S1002', semester: 2, amount: 52000, status: 'Pending', dueDate: new Date('2025-06-15') },
];

// Reusing existing mocks for simplicity, but could be expanded
const mockCourses = [
    { courseId: 'CSE101', courseName: 'Programming Fundamentals', facultyName: 'Dr. Smith', description: 'Intro to C++' },
    { courseId: 'MAT101', courseName: 'Engineering Mathematics I', facultyName: 'Dr. Johnson', description: 'Calculus and Algebra' },
    { courseId: 'PHY101', courseName: 'Physics I', facultyName: 'Dr. Lee', description: 'Mechanics and Waves' },
];

const mockTimetable = [
    { day: 'Monday', time: '09:00', subject: 'Programming Fundamentals', room: 'Lab 1' },
    { day: 'Monday', time: '11:00', subject: 'Engineering Mathematics I', room: 'Room 204' },
    { day: 'Wednesday', time: '10:00', subject: 'Physics I', room: 'Room 105' },
    { day: 'Wednesday', time: '14:00', subject: 'Programming Fundamentals', room: 'Lab 2' },
    { day: 'Friday', time: '09:00', subject: 'Engineering Mathematics I', room: 'Room 204' },
];


async function seed() {
    require('dotenv').config();

    const MONGO_URI = process.env.MONGO_URI;
    if (!MONGO_URI) { console.error('MONGO_URI not found in env'); process.exit(1); }

    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB...');

        console.log('Clearing existing data...');
        await Promise.all([
            User.deleteMany({}),
            Attendance.deleteMany({}),
            Marks.deleteMany({}),
            Fees.deleteMany({}),
            Course.deleteMany({}),
            Timetable.deleteMany({}),
        ]);
        console.log('Data cleared.');

        // 1. Seed Users
        console.log('Seeding Users...');
        // We need to map studentId to _id for other collections
        const userMap = {}; // studentId -> _id

        for (const u of mockUsers) {
            const user = new User(u);
            // Password hashing happens in pre-save hook of User model usually.
            // If not, we might need to hash it here manually if the model doesn't handle plain text.
            // Assuming model has pre-save hook based on common patterns.
            await user.save();
            if (u.role === 'student') {
                userMap[u.studentId] = user._id;
            }
        }
        console.log(`Seeded ${mockUsers.length} users.`);

        // 2. Seed Attendance
        console.log('Seeding Attendance...');
        const attendanceDocs = mockAttendance.map(a => ({
            userId: userMap[a.studentId],
            subject: a.subject,
            attendedClasses: a.attendedClasses,
            totalClasses: a.totalClasses
        })).filter(d => d.userId); // Filter out if user not found
        if (attendanceDocs.length) await Attendance.insertMany(attendanceDocs);

        // 3. Seed Marks
        console.log('Seeding Marks...');
        const marksDocs = mockMarks.map(m => ({
            userId: userMap[m.studentId],
            semester: m.semester,
            subject: m.subject,
            internalMarks: m.internalMarks,
            externalMarks: m.externalMarks,
            total: m.total,
            grade: m.grade
        })).filter(d => d.userId);
        if (marksDocs.length) await Marks.insertMany(marksDocs);

        // 4. Seed Fees
        console.log('Seeding Fees...');
        const feesDocs = mockFees.map(f => ({
            userId: userMap[f.studentId],
            semester: f.semester,
            amount: f.amount,
            status: f.status,
            dueDate: f.dueDate
        })).filter(d => d.userId);
        if (feesDocs.length) await Fees.insertMany(feesDocs);

        // 5. Seed Courses
        console.log('Seeding Courses...');
        // Courses don't strictly link to users in this simple model, or maybe they do?
        // Course model usage: just list of courses.
        if (mockCourses.length) await Course.insertMany(mockCourses);

        // 6. Seed Timetable
        console.log('Seeding Timetable...');

        const timetableDocs = [];
        Object.values(userMap).forEach(uid => {
            mockTimetable.forEach(t => {
                // Lookup course details
                const course = mockCourses.find(c => c.courseName === t.subject);

                if (course) {
                    timetableDocs.push({
                        userId: uid,
                        day: t.day,
                        time: t.time,
                        // Use courseName as subject, or t.subject (they match)
                        courseName: t.subject,
                        courseId: course.courseId,
                        facultyName: course.facultyName,
                        room: t.room
                    });
                } else {
                    // Fallback if course not found in mockCourses but exists in timetable (e.g. "Physics I" match?)
                    // Let's create a partial entry or skip. 
                    // Schema requires courseId/courseName/facultyName.
                    // "Physics I" is in mockCourses.
                    console.warn(`Warning: Course details not found for subject "${t.subject}". Skipping timetable entry.`);
                }
            });
        });
        if (timetableDocs.length) await Timetable.insertMany(timetableDocs);

        console.log('Seeding completed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Seeding errored:', err);
        process.exit(1);
    }
}

seed();
