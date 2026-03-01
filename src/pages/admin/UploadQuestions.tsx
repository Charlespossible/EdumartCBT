import React, { useState, useEffect, useCallback } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { useDropzone } from "react-dropzone";
import baseApi from "../../utils/baseApi";

const UploadQuestions: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [shouldUpload, setShouldUpload] = useState(false);

  // Handle file drop or selection
  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prev => [
      ...prev,
      ...acceptedFiles.map(file => Object.assign(file, { id: `${file.name}-${Date.now()}` })),
    ]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"] },
    multiple: true,
  });

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) {
      toast.error("Please select at least one CSV file to upload.");
      return;
    }
    setShouldUpload(true);
  };

  // Remove a specific file by its unique ID
  const removeFile = (fileId: string) => {
    setFiles(files.filter(file => (file as any).id !== fileId));
  };

  // Upload files when triggered
  useEffect(() => {
    if (!shouldUpload || files.length === 0) return;

    const uploadFiles = async () => {
      setIsUploading(true);

      try {
        const formData = new FormData();
        files.forEach(file => formData.append("files", file));

        const response = await axios.post(
          `${baseApi}/admin/upload-questions`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );

        if (response.status === 200) {
          const result = response.data;
          toast.success(
            `Successfully uploaded ${result.totalInserted} questions from ${result.filesProcessed} files!`
          );

          if (result.errors.length > 0) {
            toast.error(
              `Encountered ${result.errors.length} errors. Check console for details.`,
              { autoClose: 5000 }
            );
            console.error("Upload errors:", result.errors);
          }

          setFiles([]);
        }
      } catch (error: any) {
        console.error("Upload error:", error);
        const message = error.response
          ? error.response.data?.message || "Server error occurred."
          : "Network error. Please check your connection.";
        toast.error(message);
      } finally {
        setIsUploading(false);
        setShouldUpload(false);
      }
    };

    uploadFiles();
  }, [shouldUpload, files]);

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl mx-auto">
        {/* Dropzone Area */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive ? "border-[#66934e] bg-[#f8faf7]" : "border-gray-300 hover:border-[#66934e]"}`}
        >
          <input {...getInputProps({ name : "files" })} />
          <div className="space-y-2">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="text-lg text-gray-600">
              {isDragActive ? "Drop CSV files here" : "Drag and drop CSV files here, or click to select files"}
            </p>
            <p className="text-sm text-gray-500">Only CSV files containing exam questions</p>
          </div>
        </div>

        {/* File Preview */}
        {files.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-md font-medium text-gray-700">Selected Files:</h3>
            <ul className="divide-y divide-gray-200">
              {files.map(file => (
                <li
                  key={(file as any).id}
                  className="flex items-center justify-between py-2 px-4 hover:bg-gray-50"
                >
                  <span className="text-sm text-gray-600">
                    {file.name} - {(file.size / 1024).toFixed(1)}KB
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFile((file as any).id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full px-6 py-3 font-bold text-white bg-[#66934e] rounded-lg hover:bg-[#85b35c] 
            transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#66934e] 
            disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isUploading || files.length === 0}
        >
          {isUploading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Uploading {files.length} files...
            </span>
          ) : (
            `Upload ${files.length} File${files.length !== 1 ? "s" : ""}`
          )}
        </button>
      </form>
    </>
  );
};

export default UploadQuestions;