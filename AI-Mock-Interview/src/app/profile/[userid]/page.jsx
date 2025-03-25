'use client'
import RatingsChart from '@/components/chart';
import { Calendar, Edit, FileText, Mail, MessageSquare, Share2, Star, ThumbsUp, User, Briefcase } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Navbar from '../../dashboard/_components/navbar';

export default function ProfilePage() {
    const router = useRouter();
    const { userid } = useParams();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [data, setData] = useState({
        name: "",
        email: "",
        ProfileImage: "",
        Type: "",
        description: "",
        Github: "",
        Linkedin: "",
        Twitter: "",
        dob: "",
        resume: "",
        languages: [],
        frameworks: [],
        tools: []
    });

    const [experiences, setExperiences] = useState([]);

    useEffect(() => {
        let isMounted = true;

        const fetchData = async () => {
            if (!userid) return;

            setIsLoading(true);
            setError(null);

            try {
                const [profileResponse, experiencesResponse] = await Promise.all([
                    fetch(`/api/getProfile/${userid}`).then(res => {
                        if (!res.ok) throw new Error('Failed to fetch profile');
                        return res.json();
                    }),
                    fetch(`/api/experiences/${userid}`).then(res => {
                        if (!res.ok) throw new Error('Failed to fetch experiences');
                        return res.json();
                    }),
                ]);

                if (isMounted) {
                    if (profileResponse && profileResponse.success && profileResponse.profile) {
                        setData(profileResponse.profile);
                    }

                    if (experiencesResponse && experiencesResponse.success) {
                        setExperiences(experiencesResponse.experiences || []);
                    }
                }
            } catch (error) {
                console.log("Error fetching data:", error.message||error);
                if (isMounted) {
                    setError(error.message || "An error occurred while fetching data");
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        fetchData();

        return () => {
            isMounted = false;
        };
    }, [userid]);

    const formatDate = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const getColorForSkill = (index, type) => {
        const colorSets = {
            language: ["bg-gradient-to-r from-blue-500 to-cyan-500", "bg-gradient-to-r from-green-400 to-emerald-600", "bg-gradient-to-r from-purple-500 to-indigo-600"],
            framework: ["bg-gradient-to-r from-red-500 to-orange-500", "bg-gradient-to-r from-teal-400 to-blue-500", "bg-gradient-to-r from-pink-500 to-rose-500"],
            tool: ["bg-gradient-to-r from-amber-500 to-yellow-500", "bg-gradient-to-r from-gray-600 to-slate-800", "bg-gradient-to-r from-fuchsia-500 to-purple-600"]
        };
        const colors = colorSets[type] || colorSets.language;
        return colors[index % colors.length];
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#1a2331] to-[#2c3e50] text-white">
            <Navbar />

            <div className="container mx-auto px-4 py-8">
                {/* Profile Header */}
                <div className="grid md:grid-cols-3 gap-8">
                    {/* Profile Image and Actions */}
                    <div className="bg-[#2c3e50] rounded-2xl p-6 shadow-2xl border border-[#3a4b5c] flex flex-col items-center">
                        <div className="relative mb-6">
                            <img
                                src={data.ProfileImage || "/default-avatar.png"}
                                alt="Profile"
                                className="w-36 h-36 rounded-full object-cover border-4 border-[#3a4b5c] shadow-lg"
                            />
                            <div className="absolute bottom-2 right-2 bg-green-500 w-5 h-5 rounded-full border-2 border-white"></div>
                        </div>

                        <h2 className="text-2xl font-bold text-white mb-2">{data.name}</h2>
                        <p className="text-cyan-400 mb-4">{data.Type}</p>

                        <div className="flex space-x-4 mb-6">
                            <Link
                                href="/dashboard/EditProfile"
                                className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition"
                            >
                                <Edit className="w-5 h-5" />
                                <span>Edit Profile</span>
                            </Link>
                            <button
                                className="bg-transparent border border-cyan-600 text-cyan-400 hover:bg-cyan-600/10 px-4 py-2 rounded-lg flex items-center space-x-2 transition"
                            >
                                <Share2 className="w-5 h-5" />
                                <span>Share</span>
                            </button>
                        </div>

                        {data.resume && (
                            <Link
                                href={data.resume}
                                target="_blank"
                                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-4 py-3 rounded-lg flex items-center justify-center space-x-2 transition"
                            >
                                <FileText className="w-5 h-5" />
                                <span>Download Resume</span>
                            </Link>
                        )}
                    </div>

                    {/* Profile Stats and Description */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="bg-[#2c3e50] rounded-2xl p-6 shadow-2xl border border-[#3a4b5c]">
                            <h3 className="text-xl font-semibold text-cyan-400 mb-4">Overview</h3>
                            <div className="grid md:grid-cols-3 gap-4">
                                <div className="bg-[#3a4b5c] rounded-lg p-4 text-center">
                                    <Star className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                                    <h4 className="text-lg font-bold">{data.AvgRating || "N/A"}</h4>
                                    <p className="text-sm text-gray-400">Average Rating</p>
                                </div>
                                <div className="bg-[#3a4b5c] rounded-lg p-4 text-center">
                                    <ThumbsUp className="w-8 h-8 text-green-400 mx-auto mb-2" />
                                    <h4 className="text-lg font-bold">1,203</h4>
                                    <p className="text-sm text-gray-400">Likes</p>
                                </div>
                                <div className="bg-[#3a4b5c] rounded-lg p-4 text-center">
                                    <MessageSquare className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                                    <h4 className="text-lg font-bold">3</h4>
                                    <p className="text-sm text-gray-400">Mock Interviews</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-[#2c3e50] rounded-2xl p-6 shadow-2xl border border-[#3a4b5c]">
                            <h3 className="text-xl font-semibold text-cyan-400 mb-4">Description</h3>
                            <p className="text-gray-300">{data.description || "No description available"}</p>
                        </div>
                    </div>
                </div>

                {/* Skills and Social Section */}
                <div className="grid md:grid-cols-3 gap-8 mt-8">
                    {/* Personal Info */}
                    <div className="bg-[#2c3e50] rounded-2xl p-6 shadow-2xl border border-[#3a4b5c]">
                        <h3 className="text-xl font-semibold text-cyan-400 mb-4">Personal Information</h3>
                        <div className="space-y-4">
                            <div className="flex items-center space-x-3">
                                <Mail className="w-6 h-6 text-cyan-400" />
                                <span>{data.email || "Not provided"}</span>
                            </div>
                            <div className="flex items-center space-x-3">
                                <User className="w-6 h-6 text-cyan-400" />
                                <span>{data.Gender || "Not specified"}</span>
                            </div>
                            <div className="flex items-center space-x-3">
                                <Calendar className="w-6 h-6 text-cyan-400" />
                                <span>{formatDate(data.dob) || "Not provided"}</span>
                            </div>
                        </div>
                    </div>

                    {/* ADDED: Experience Section */}
                    <div className="md:col-span-2 bg-[#2c3e50] rounded-2xl p-6 shadow-2xl border border-[#3a4b5c]">
                        <h3 className="text-xl font-semibold text-cyan-400 mb-6">Experience</h3>
                        
                        {experiences.length > 0 ? (
                            <div className="space-y-6">
                                {experiences.map((exp, index) => (
                                    <div key={exp.id || index} className="bg-[#3a4b5c] rounded-lg p-5 border border-[#4a5b6c]">
                                        <div className="flex items-start">
                                            <Briefcase className="w-6 h-6 text-cyan-400 mt-1 mr-3 flex-shrink-0" />
                                            <div>
                                                <h4 className="text-lg font-medium text-white">{exp.CompanyName || "Company"}</h4>
                                                <p className="text-cyan-300 mt-1">{exp.Role || "Role"}</p>
                                                <p className="text-gray-400 text-sm mt-1">{exp.Duration || "Duration not specified"}</p>
                                                <p className="text-gray-300 mt-3">{exp.Description || "No description provided."}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-[#3a4b5c] rounded-lg p-5 text-center">
                                <p className="text-gray-400">No experience details available</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Skills Section - Moved below Experience */}
                <div className="mt-8 bg-[#2c3e50] rounded-2xl p-6 shadow-2xl border border-[#3a4b5c]">
                    <h3 className="text-xl font-semibold text-cyan-400 mb-6">Skills Breakdown</h3>

                    <div className="space-y-6">
                        <div>
                            <h4 className="text-lg font-medium mb-3">Programming Languages</h4>
                            <div className="flex flex-wrap gap-2">
                                {data.languages?.map((lang, index) => (
                                    <span
                                        key={index}
                                        className={`${getColorForSkill(index, 'language')} text-white px-3 py-1 rounded-full text-sm`}
                                    >
                                        {lang}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h4 className="text-lg font-medium mb-3">Frameworks</h4>
                            <div className="flex flex-wrap gap-2">
                                {data.frameworks?.map((framework, index) => (
                                    <span
                                        key={index}
                                        className={`${getColorForSkill(index, 'framework')} text-white px-3 py-1 rounded-full text-sm`}
                                    >
                                        {framework}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h4 className="text-lg font-medium mb-3">Tools</h4>
                            <div className="flex flex-wrap gap-2">
                                {data.tools?.map((tool, index) => (
                                    <span
                                        key={index}
                                        className={`${getColorForSkill(index, 'tool')} text-white px-3 py-1 rounded-full text-sm`}
                                    >
                                        {tool}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Performance Section */}
                <div className="grid md:grid-cols-2 gap-8 mt-8">
                    <div className="bg-[#2c3e50] rounded-2xl p-6 shadow-2xl border border-[#3a4b5c]">
                        <h3 className="text-xl font-semibold text-cyan-400 mb-4">Social Performance</h3>
                        <div className="space-y-4">
                            {['Shots View', 'Likes', 'Comments'].map((metric, index) => (
                                <div key={metric} className="relative">
                                    <div className="flex justify-between mb-2">
                                        <span className="text-sm text-gray-400">{metric}</span>
                                        <span className="text-sm text-gray-300">{(index + 1) * 15}%</span>
                                    </div>
                                    <div className="w-full bg-[#3a4b5c] rounded-full h-2">
                                        <div
                                            className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full"
                                            style={{width: `${(index + 1) * 15}%`}}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-[#2c3e50] rounded-2xl p-6 shadow-2xl border border-[#3a4b5c]">
                        <h3 className="text-xl font-semibold text-cyan-400 mb-4">Monthly Activity</h3>
                        <RatingsChart userId={userid}/>
                    </div>
                </div>
            </div>
        </div>
    );
}