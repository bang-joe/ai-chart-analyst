import React from 'react';
import { UploadIcon } from './icons';

interface ImageUploaderProps {
    previewUrl: string | null;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ previewUrl, onChange }) => {
    return (
        <div>
            <label htmlFor="chart-upload" className="block text-sm font-medium text-gray-400 mb-2">Chart Image</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md cursor-pointer hover:border-amber-500 transition-colors duration-300 bg-gray-900/50">
                <div className="space-y-1 text-center w-full">
                    {previewUrl ? (
                        <img src={previewUrl} alt="Chart preview" className="mx-auto h-48 w-auto object-contain rounded-md" />
                    ) : (
                        <>
                            <div className="mx-auto h-12 w-12 text-gray-500 transition-transform duration-300 transform hover:scale-110">
                                <UploadIcon/>
                            </div>
                            <div className="flex text-sm text-gray-500">
                                <label
                                    htmlFor="file-upload"
                                    className="relative cursor-pointer rounded-md font-medium text-amber-400 hover:text-amber-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-gray-900 focus-within:ring-amber-500"
                                >
                                    <span>Upload a file</span>
                                    <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={onChange} accept="image/png, image/jpeg, image/webp" />
                                </label>
                                <p className="pl-1">or drag and drop</p>
                            </div>
                            <p className="text-xs text-gray-600">PNG, JPG, WEBP up to 10MB</p>
                        </>
                    )}
                </div>
            </div>
             {previewUrl && (
                <div className="text-center mt-2">
                    <label
                        htmlFor="file-upload-replace"
                        className="cursor-pointer rounded-md font-medium text-sm text-amber-400 hover:text-amber-500"
                    >
                        Replace image
                        <input id="file-upload-replace" name="file-upload-replace" type="file" className="sr-only" onChange={onChange} accept="image/png, image/jpeg, image/webp" />
                    </label>
                </div>
            )}
        </div>
    );
};