import React, { useState, useCallback } from 'react';
import { Upload, Loader2, FileImage } from 'lucide-react';
import axios from 'axios';

const FileUpload = ({ onUploadSuccess }) => {
    const [dragActive, setDragActive] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);
    const [showSettings, setShowSettings] = useState(false);
    const [settings, setSettings] = useState({
        steps: 30,
        guidance: 7.5,
        seed: ""
    });

    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    }, []);

    const uploadFile = async (file) => {
        setUploading(true);
        setErrorMsg(null);
        const formData = new FormData();
        formData.append("image", file);
        formData.append("steps", settings.steps);
        formData.append("guidance_scale", settings.guidance);
        formData.append("seed", settings.seed === "" ? -1 : settings.seed);

        try {
            const response = await axios.post("http://127.0.0.1:8000/generate", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
            onUploadSuccess(response.data.task_id);
        } catch (error) {
            console.error("Upload failed", error);
            setErrorMsg("Failed to upload image. Check if backend is running.");
        } finally {
            setUploading(false);
            setDragActive(false);
        }
    };

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            uploadFile(e.dataTransfer.files[0]);
        }
    }, [settings]); // Add settings dependency

    const handleChange = (e) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            uploadFile(e.target.files[0]);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto space-y-4">
            <div
                className={`relative group border-2 border-dashed rounded-xl p-8 transition-all duration-300 ${dragActive
                    ? "border-cyan-400 bg-cyan-900/20 scale-[1.02]"
                    : "border-slate-600 hover:border-cyan-500/50 hover:bg-slate-800/50"
                    }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                <input
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleChange}
                    accept="image/png, image/jpeg, image/jpg"
                    disabled={uploading}
                />

                <div className="flex flex-col items-center justify-center space-y-4 text-center">
                    <div className="p-4 rounded-full bg-slate-900 border border-slate-700 shadow-[0_0_15px_rgba(34,211,238,0.1)] group-hover:shadow-[0_0_25px_rgba(34,211,238,0.2)] transition-shadow">
                        {uploading ? (
                            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                        ) : (
                            <Upload className="w-8 h-8 text-cyan-400" />
                        )}
                    </div>

                    <div className="space-y-1">
                        <h3 className="text-lg font-medium text-slate-200">
                            {uploading ? "Uploading..." : "Upload Image"}
                        </h3>
                        <p className="text-sm text-slate-400">
                            Drag & Drop or Click to Select
                        </p>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-900/50 px-3 py-1 rounded-full border border-slate-800">
                        <FileImage className="w-3 h-3" />
                        <span>JPG, PNG supported</span>
                    </div>
                </div>
            </div>

            {/* Settings Toggle */}
            <div className="flex justify-end">
                <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="text-xs text-cyan-400 hover:text-cyan-300 underline"
                >
                    {showSettings ? "Hide Advanced Settings" : "Show Advanced Settings"}
                </button>
            </div>

            {/* Settings Panel */}
            {showSettings && (
                <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 space-y-3 animate-in fade-in slide-in-from-top-2">
                    <div>
                        <label className="block text-xs text-slate-400 mb-1">Steps ({settings.steps})</label>
                        <input
                            type="range"
                            min="15"
                            max="50"
                            value={settings.steps}
                            onChange={(e) => setSettings({ ...settings, steps: parseInt(e.target.value) })}
                            className="w-full accent-cyan-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-slate-400 mb-1">Guidance Scale ({settings.guidance})</label>
                        <input
                            type="range"
                            min="1.0"
                            max="20.0"
                            step="0.5"
                            value={settings.guidance}
                            onChange={(e) => setSettings({ ...settings, guidance: parseFloat(e.target.value) })}
                            className="w-full accent-cyan-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-slate-400 mb-1">Seed (Optional)</label>
                        <input
                            type="number"
                            placeholder="Random"
                            value={settings.seed}
                            onChange={(e) => setSettings({ ...settings, seed: e.target.value })}
                            className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm text-cyan-100 placeholder-slate-500 focus:border-cyan-500 outline-none"
                        />
                    </div>
                </div>
            )}

            {errorMsg && (
                <div className="mt-4 p-3 bg-red-900/20 border border-red-500/50 rounded-lg text-red-200 text-sm text-center">
                    {errorMsg}
                </div>
            )}
        </div>
    );
};

export default FileUpload;
