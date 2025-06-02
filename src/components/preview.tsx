import { PanelTop } from "lucide-react";
export function Preview() {
  return (
    <div className="h-full">
      <div className="h-8 bg-gray-800 border-b border-gray-700 flex items-center px-3">
        <PanelTop className="w-4 h-4 mr-2" />
        <span className="text-sm text-gray-300">Preview</span>
      </div>
      <div className="p-8 h-full overflow-auto">
        <div className="bg-blue-600 text-white p-4 mb-8">
          <h1 className="text-xl font-bold">The Preview Will be Shown Here </h1>
        </div>
      </div>
    </div>
  );
}
