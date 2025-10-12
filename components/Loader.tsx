export const Loader: React.FC = () => (
  <div className="flex flex-col items-center justify-center space-y-3">
    <div className="flex space-x-2">
      <div className="w-3 h-3 bg-amber-400 rounded-full animate-bounce"></div>
      <div className="w-3 h-3 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.2s]"></div>
      <div className="w-3 h-3 bg-amber-600 rounded-full animate-bounce [animation-delay:-0.4s]"></div>
    </div>
    <p className="text-sm text-gray-400 font-medium mt-2">AI sedang memproses chart...</p>
  </div>
);
