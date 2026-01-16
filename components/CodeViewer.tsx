import React, { useMemo, useState } from 'react';
import { FolderIcon, FileCodeIcon, ChevronDownIcon, SidebarIcon } from './Icons';

interface CodeViewerProps {
  code: string | null;
}

interface VirtualFile {
  name: string;
  language: string;
  content: string;
  path: string;
}

const CodeViewer: React.FC<CodeViewerProps> = ({ code }) => {
  const [activeFile, setActiveFile] = useState<string>('src/index.html');
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  const files = useMemo<VirtualFile[]>(() => {
    if (!code) return [];

    const cssMatch = code.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
    const jsMatch = code.match(/<script[^>]*>([\s\S]*?)<\/script>/i);

    const cssContent = cssMatch ? cssMatch[1].trim() : '/* No styles found */';
    const jsContent = jsMatch ? jsMatch[1].trim() : '// No script found';

    // Create a "clean" HTML version that references the external files for display purposes
    let htmlContent = code;
    if (cssMatch) {
      htmlContent = htmlContent.replace(cssMatch[0], '<!-- Styles extracted to style.css -->\n    <link rel="stylesheet" href="style.css">');
    }
    if (jsMatch) {
      htmlContent = htmlContent.replace(jsMatch[0], '<!-- Script extracted to script.js -->\n    <script src="script.js"></script>');
    }

    return [
      { name: 'index.html', language: 'html', content: htmlContent, path: 'src/index.html' },
      { name: 'style.css', language: 'css', content: cssContent, path: 'src/style.css' },
      { name: 'script.js', language: 'javascript', content: jsContent, path: 'src/script.js' },
    ];
  }, [code]);

  const currentFile = files.find(f => f.path === activeFile) || files[0];

  if (!code) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-500 bg-[#1e1e1e] rounded-xl border border-secondary">
        <div className="text-center">
          <p className="mb-2 text-4xl">💻</p>
          <p>No code generated yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex bg-[#1e1e1e] rounded-xl border border-secondary overflow-hidden font-mono text-sm shadow-2xl">
      {/* Sidebar - File Explorer */}
      <div className={`${isSidebarOpen ? 'w-48 md:w-56' : 'w-0'} bg-zinc-900 border-r border-secondary transition-all duration-300 flex flex-col shrink-0 overflow-hidden`}>
        <div className="p-3 pl-4 pr-2 text-xs font-bold text-zinc-400 tracking-widest uppercase border-b border-zinc-800 flex justify-between items-center h-10 shrink-0">
          <span className="truncate">Explorer</span>
          <button 
            onClick={() => setSidebarOpen(false)} 
            className="p-1 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
            title="Close Explorer"
          >
            <SidebarIcon />
          </button>
        </div>
        
        <div className="p-2 overflow-y-auto">
          {/* Project Root */}
          <div className="mb-2">
            <div className="flex items-center gap-1 text-zinc-300 px-2 py-1 cursor-default">
              <ChevronDownIcon />
              <span className="font-bold text-xs">PROJECT</span>
            </div>
            
            {/* Src Folder */}
            <div className="pl-4">
              <div className="flex items-center gap-1 text-zinc-400 px-2 py-1">
                <ChevronDownIcon />
                <FolderIcon />
                <span className="ml-1">src</span>
              </div>

              {/* Files */}
              <div className="pl-6 flex flex-col gap-0.5 mt-1">
                {files.map((file) => (
                  <button
                    key={file.path}
                    onClick={() => setActiveFile(file.path)}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors w-full text-left ${
                      activeFile === file.path 
                        ? 'bg-primary/20 text-primary' 
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                    }`}
                  >
                    <FileCodeIcon />
                    {file.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Tab Header */}
        <div className="flex bg-zinc-900 border-b border-zinc-800 overflow-x-auto scrollbar-hide shrink-0 h-10 items-center">
          {!isSidebarOpen && (
             <button
                onClick={() => setSidebarOpen(true)}
                className="h-full px-3 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 border-r border-zinc-800 transition-colors flex items-center justify-center"
                title="Open Explorer"
             >
                <SidebarIcon />
             </button>
          )}
          
          {files.map((file) => (
             <button
                key={file.path}
                onClick={() => setActiveFile(file.path)}
                className={`h-full px-4 text-xs border-r border-zinc-800 flex items-center gap-2 min-w-fit transition-colors ${
                  activeFile === file.path
                    ? 'bg-[#1e1e1e] text-zinc-200 border-t-2 border-t-primary'
                    : 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 border-t-2 border-t-transparent'
                }`}
             >
                <span className={
                    file.name.endsWith('html') ? 'text-orange-500' : 
                    file.name.endsWith('css') ? 'text-blue-400' : 
                    'text-yellow-400'
                }>
                   {file.name.endsWith('html') ? '<>' : file.name.endsWith('css') ? '#' : 'JS'}
                </span>
                {file.name}
             </button>
          ))}
        </div>

        {/* Code Content */}
        <div className="flex-1 overflow-auto p-4 custom-scrollbar">
          <pre className="font-mono text-sm leading-relaxed tab-4">
            <code className="text-zinc-300 block">
              {currentFile?.content.split('\n').map((line, i) => (
                <div key={i} className="table-row">
                  <span className="table-cell text-right pr-4 select-none text-zinc-700 w-8 text-xs">{i + 1}</span>
                  <span className="table-cell whitespace-pre-wrap break-all">{line}</span>
                </div>
              ))}
            </code>
          </pre>
        </div>
      </div>
    </div>
  );
};

export default CodeViewer;