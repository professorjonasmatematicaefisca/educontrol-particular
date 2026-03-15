import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
    Pencil, 
    Eraser, 
    Type, 
    Image as ImageIcon, 
    Square, 
    Circle, 
    Minus, 
    Maximize2, 
    Minimize2, 
    Download, 
    Trash2, 
    Undo, 
    Redo, 
    Move, 
    MousePointer2,
    Highlighter,
    Compass,
    Ruler as RulerIcon,
    ChevronLeft,
    ChevronRight,
    ZoomIn,
    ZoomOut,
    Copy,
    Clipboard
} from 'lucide-react';
import { UserRole, Discipline } from './types';
import { SupabaseService } from './services/supabaseService';
import * as pdfjs from 'pdfjs-dist';

// pdfjs worker setup
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface WhiteboardProps {
    onShowToast: (msg: string) => void;
    userEmail: string;
    userRole: UserRole;
}

type Tool = 'pen' | 'eraser' | 'highlighter' | 'text' | 'rect' | 'circle' | 'line' | 'select' | 'pan' | 'compass' | 'ruler';

interface Point {
    x: number;
    y: number;
}

interface DrawElement {
    type: Tool | 'image';
    points?: Point[];
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    color?: string;
    size?: number;
    text?: string;
    imageData?: string;
    rotation?: number;
}

export const Whiteboard: React.FC<WhiteboardProps> = ({ onShowToast, userEmail, userRole }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const bgCanvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    
    const [selectedTool, setSelectedTool] = useState<Tool>('pen');
    const [color, setColor] = useState('#ffffff');
    const [brushSize, setBrushSize] = useState(3);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [disciplines, setDisciplines] = useState<Discipline[]>([]);
    const [selectedDiscipline, setSelectedDiscipline] = useState<Discipline | null>(null);
    
    // History for Undo/Redo
    const [elements, setElements] = useState<DrawElement[]>([]);
    const [redoStack, setRedoStack] = useState<DrawElement[]>([]);
    
    // Interaction state
    const [isDrawing, setIsDrawing] = useState(false);
    const [isPanning, setIsPanning] = useState(false);
    const [currentElement, setCurrentElement] = useState<DrawElement | null>(null);
    const [lastPoint, setLastPoint] = useState<Point | null>(null);

    // Tools visibility
    const [showDisciplinePicker, setShowDisciplinePicker] = useState(true);

    // Specialized tools positions
    const [rulerPos, setRulerPos] = useState({ x: 200, y: 300, rotation: 0 });
    const [compassPos, setCompassPos] = useState({ x: 400, y: 300, radius: 100, rotation: 0 });

    useEffect(() => {
        loadDisciplines();
        setupClipboard();
    }, []);

    const setupClipboard = () => {
        const handlePaste = async (e: ClipboardEvent) => {
            const items = e.clipboardData?.items;
            if (!items) return;

            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    const blob = items[i].getAsFile();
                    if (blob) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                            const dataUrl = event.target?.result as string;
                            const newEl: DrawElement = {
                                type: 'image',
                                imageData: dataUrl,
                                x: 100,
                                y: 100,
                                width: 300,
                                height: 300
                            };
                            setElements(prev => [...prev, newEl]);
                            onShowToast('Imagem colada com sucesso!');
                        };
                        reader.readAsDataURL(blob);
                    }
                } else if (items[i].type === 'text/plain') {
                    items[i].getAsString((text) => {
                        const newEl: DrawElement = {
                            type: 'text',
                            text,
                            x: 100,
                            y: 100,
                            color,
                            size: 24
                        };
                        setElements(prev => [...prev, newEl]);
                        onShowToast('Texto colado com sucesso!');
                    });
                }
            }
        };

        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    };

    const loadDisciplines = async () => {
        const data = await SupabaseService.getDisciplines();
        setDisciplines(data);
    };

    // Initialize Canvas with proper High-DPI support and A4 aspect ratio
    useEffect(() => {
        const initCanvas = () => {
            const canvas = canvasRef.current;
            const bgCanvas = bgCanvasRef.current;
            const container = containerRef.current;
            if (!canvas || !bgCanvas || !container) return;

            // A4 Portrait aspect ratio: 210 x 297 mm -> ~1 : 1.414
            const containerWidth = container.clientWidth - 40;
            const containerHeight = container.clientHeight - 40;
            
            let width = containerWidth;
            let height = width * 1.414;
            
            if (height > containerHeight) {
                height = containerHeight;
                width = height / 1.414;
            }

            const dpr = window.devicePixelRatio || 1;
            
            [canvas, bgCanvas].forEach(c => {
                c.width = width * dpr;
                c.height = height * dpr;
                c.style.width = `${width}px`;
                c.style.height = `${height}px`;
                const ctx = c.getContext('2d');
                if (ctx) ctx.scale(dpr, dpr);
            });

            renderBackground();
            renderAllElements();
        };

        initCanvas();
        window.addEventListener('resize', initCanvas);
        return () => window.removeEventListener('resize', initCanvas);
    }, [selectedDiscipline, zoom, pan]);

    const renderBackground = async () => {
        const bgCanvas = bgCanvasRef.current;
        if (!bgCanvas) return;
        const ctx = bgCanvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
        
        if (selectedDiscipline?.whiteboardBackgroundUrl) {
            try {
                const loadingTask = pdfjs.getDocument(selectedDiscipline.whiteboardBackgroundUrl);
                const pdf = await loadingTask.promise;
                const page = await pdf.getPage(1);
                
                const viewport = page.getViewport({ scale: 1 });
                const scale = bgCanvas.width / (viewport.width * (window.devicePixelRatio || 1));
                const scaledViewport = page.getViewport({ scale });
                
                await page.render({
                    canvasContext: ctx,
                    viewport: scaledViewport
                }).promise;
            } catch (err) {
                console.error("Error rendering PDF background:", err);
                renderGrid(ctx, bgCanvas.width, bgCanvas.height);
            }
        } else {
            renderGrid(ctx, bgCanvas.width, bgCanvas.height);
        }
    };

    const renderGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, width, height);
        
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 0.5;
        
        const gridSize = 40;
        for (let x = 0; x <= width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        for (let y = 0; y <= height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
    };

    const renderAllElements = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        elements.forEach(el => drawElement(ctx, el));
        if (currentElement) drawElement(ctx, currentElement);
    }, [elements, currentElement]);

    const drawElement = (ctx: CanvasRenderingContext2D, el: DrawElement) => {
        ctx.save();
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.strokeStyle = el.color || color;
        ctx.lineWidth = el.size || brushSize;
        ctx.fillStyle = el.color || color;

        switch (el.type) {
            case 'pen':
            case 'eraser':
            case 'highlighter':
                if (el.type === 'eraser') ctx.globalCompositeOperation = 'destination-out';
                if (el.type === 'highlighter') {
                    ctx.globalAlpha = 0.4;
                    ctx.lineWidth = el.size ? el.size * 3 : brushSize * 3;
                }
                if (el.points && el.points.length > 0) {
                    ctx.beginPath();
                    ctx.moveTo(el.points[0].x, el.points[0].y);
                    el.points.forEach(p => ctx.lineTo(p.x, p.y));
                    ctx.stroke();
                }
                break;
            case 'rect':
                if (el.x !== undefined && el.y !== undefined && el.width !== undefined && el.height !== undefined) {
                    ctx.strokeRect(el.x, el.y, el.width, el.height);
                }
                break;
            case 'circle':
                if (el.x !== undefined && el.y !== undefined && el.width !== undefined && el.height !== undefined) {
                    const radius = Math.sqrt(el.width ** 2 + el.height ** 2);
                    ctx.beginPath();
                    ctx.arc(el.x, el.y, radius, 0, 2 * Math.PI);
                    ctx.stroke();
                }
                break;
            case 'line':
                if (el.points && el.points.length === 2) {
                    ctx.beginPath();
                    ctx.moveTo(el.points[0].x, el.points[0].y);
                    ctx.lineTo(el.points[1].x, el.points[1].y);
                    ctx.stroke();
                }
                break;
            case 'text':
                if (el.text && el.x !== undefined && el.y !== undefined) {
                    ctx.font = `${el.size || 24}px sans-serif`;
                    ctx.fillText(el.text, el.x, el.y);
                }
                break;
            case 'image':
                if (el.imageData && el.x !== undefined && el.y !== undefined) {
                    const img = new Image();
                    img.src = el.imageData;
                    if (img.complete) {
                        ctx.drawImage(img, el.x, el.y, el.width || 300, el.height || 300);
                    } else {
                        img.onload = () => renderAllElements();
                    }
                }
                break;
        }
        ctx.restore();
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        const { offsetX, offsetY } = e.nativeEvent;
        const x = offsetX / zoom - pan.x;
        const y = offsetY / zoom - pan.y;

        if (selectedTool === 'pan') {
            setIsPanning(true);
            setLastPoint({ x: e.clientX, y: e.clientY });
            return;
        }

        setIsDrawing(true);
        const newEl: DrawElement = {
            type: selectedTool,
            points: [{ x, y }],
            color,
            size: brushSize,
            x: x,
            y: y,
            width: 0,
            height: 0
        };
        setCurrentElement(newEl);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isPanning && lastPoint) {
            const dx = e.clientX - lastPoint.x;
            const dy = e.clientY - lastPoint.y;
            setPan(p => ({ x: p.x + dx / zoom, y: p.y + dy / zoom }));
            setLastPoint({ x: e.clientX, y: e.clientY });
            return;
        }

        if (!isDrawing || !currentElement) return;

        const { offsetX, offsetY } = e.nativeEvent;
        const x = offsetX / zoom - pan.x;
        const y = offsetY / zoom - pan.y;

        if (['pen', 'eraser', 'highlighter'].includes(selectedTool)) {
            setCurrentElement({
                ...currentElement,
                points: [...(currentElement.points || []), { x, y }]
            });
        } else {
            setCurrentElement({
                ...currentElement,
                width: x - (currentElement.x || 0),
                height: y - (currentElement.y || 0)
            });
        }
        renderAllElements();
    };

    const handleMouseUp = () => {
        if (isPanning) {
            setIsPanning(false);
            setLastPoint(null);
            return;
        }

        if (!isDrawing || !currentElement) return;
        
        setElements([...elements, currentElement]);
        setCurrentElement(null);
        setIsDrawing(false);
        setRedoStack([]);
    };

    const handleUndo = () => {
        if (elements.length === 0) return;
        const last = elements[elements.length - 1];
        setRedoStack([...redoStack, last]);
        setElements(elements.slice(0, -1));
    };

    const handleRedo = () => {
        if (redoStack.length === 0) return;
        const last = redoStack[redoStack.length - 1];
        setElements([...elements, last]);
        setRedoStack(redoStack.slice(0, -1));
    };

    const clearCanvas = () => {
        if (confirm('Limpar toda a lousa?')) {
            setElements([]);
            setRedoStack([]);
        }
    };

    const renderToolbar = () => (
        <div className="flex flex-col gap-2 bg-[#1e293b] p-3 rounded-xl border border-white/10 shadow-2xl z-20">
            <div className="grid grid-cols-2 gap-2">
                <ToolButton icon={<Pencil size={20}/>} active={selectedTool === 'pen'} onClick={() => setSelectedTool('pen')} title="Caneta" />
                <ToolButton icon={<Highlighter size={20}/>} active={selectedTool === 'highlighter'} onClick={() => setSelectedTool('highlighter')} title="Marca Texto" />
                <ToolButton icon={<Eraser size={20}/>} active={selectedTool === 'eraser'} onClick={() => setSelectedTool('eraser')} title="Borracha" />
                <ToolButton icon={<Square size={20}/>} active={selectedTool === 'rect'} onClick={() => setSelectedTool('rect')} title="Retângulo" />
                <ToolButton icon={<Circle size={20}/>} active={selectedTool === 'circle'} onClick={() => setSelectedTool('circle')} title="Círculo" />
                <ToolButton icon={<Minus size={20}/>} active={selectedTool === 'line'} onClick={() => setSelectedTool('line')} title="Linha" />
                <ToolButton icon={<RulerIcon size={20}/>} active={selectedTool === 'ruler'} onClick={() => setSelectedTool('ruler')} title="Régua" />
                <ToolButton icon={<Compass size={20}/>} active={selectedTool === 'compass'} onClick={() => setSelectedTool('compass')} title="Compasso" />
                <ToolButton icon={<MousePointer2 size={20}/>} active={selectedTool === 'select'} onClick={() => setSelectedTool('select')} title="Selecionar" />
                <ToolButton icon={<Move size={20}/>} active={selectedTool === 'pan'} onClick={() => setSelectedTool('pan')} title="Mover Tela" />
            </div>
            
            <hr className="border-white/5 my-1" />
            
            <div className="flex flex-wrap gap-1.5 justify-center py-2">
                {['#ffffff', '#000000', '#ef4444', '#22c55e', '#3b82f6', '#eab308', '#ec4899', '#a855f7'].map(c => (
                    <button 
                        key={c}
                        onClick={() => setColor(c)}
                        className={`w-6 h-6 rounded-full border-2 ${color === c ? 'border-white' : 'border-transparent'}`}
                        style={{ backgroundColor: c }}
                    />
                ))}
            </div>

            <div className="flex flex-col gap-1 px-1">
                <label className="text-[10px] text-gray-500 font-bold uppercase">Tamanho</label>
                <input 
                    type="range" 
                    min="1" 
                    max="50" 
                    value={brushSize} 
                    onChange={(e) => setBrushSize(parseInt(e.target.value))}
                    className="w-full accent-emerald-500"
                />
            </div>

            <hr className="border-white/5 my-1" />

            <div className="grid grid-cols-2 gap-2">
                <ToolButton icon={<Undo size={20}/>} onClick={handleUndo} title="Desfazer" />
                <ToolButton icon={<Redo size={20}/>} onClick={handleRedo} title="Refazer" />
                <ToolButton icon={<Trash2 size={20}/>} onClick={clearCanvas} title="Limpar" className="text-red-400 hover:bg-red-400/10" />
                <ToolButton icon={<Download size={20}/>} onClick={() => {}} title="Salvar" />
            </div>
        </div>
    );

    return (
        <div className="h-[calc(100vh-140px)] flex bg-[#0f172a] rounded-2xl overflow-hidden border border-white/5 relative">
            <div className={`transition-all duration-300 ${showDisciplinePicker ? 'w-64' : 'w-0'} bg-[#1e293b] border-r border-white/10 flex flex-col overflow-hidden`}>
                <div className="p-4 border-b border-white/5 flex justify-between items-center">
                    <h3 className="font-bold text-white text-sm">Disciplina / Aula</h3>
                    <button onClick={() => setShowDisciplinePicker(false)} className="p-1 hover:bg-white/5 rounded text-gray-400">
                        <ChevronLeft size={16} />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {disciplines.map(d => (
                        <button
                            key={d.id}
                            onClick={() => setSelectedDiscipline(d)}
                            className={`w-full text-left p-3 rounded-lg transition-all ${selectedDiscipline?.id === d.id ? 'bg-emerald-500 text-white font-bold' : 'hover:bg-white/5 text-gray-400'}`}
                        >
                            <div className="text-xs font-bold uppercase opacity-60 mb-0.5">{d.name}</div>
                            <div className="text-sm truncate">{d.displayName || d.name}</div>
                        </button>
                    ))}
                </div>
            </div>

            {!showDisciplinePicker && (
                <button 
                    onClick={() => setShowDisciplinePicker(true)}
                    className="absolute left-4 top-4 z-30 p-2 bg-[#1e293b] border border-white/10 rounded-lg text-gray-400 hover:text-white transition-all shadow-xl"
                >
                    <ChevronRight size={20} />
                </button>
            )}

            <div className="absolute left-1/2 -translate-x-1/2 bottom-6 flex gap-4 items-end pointer-events-none">
                <div className="pointer-events-auto">
                    {renderToolbar()}
                </div>
            </div>

            <div className="absolute right-6 bottom-6 flex items-center gap-3 bg-[#1e293b] p-2 rounded-xl border border-white/10 shadow-2xl z-20">
                <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} className="p-2 hover:bg-white/5 rounded-lg text-gray-400"><ZoomOut size={18}/></button>
                <span className="text-xs font-mono text-gray-400 w-12 text-center">{Math.round(zoom * 100)}%</span>
                <button onClick={() => setZoom(z => Math.min(3, z + 0.1))} className="p-2 hover:bg-white/5 rounded-lg text-gray-400"><ZoomIn size={18}/></button>
                <div className="w-px h-6 bg-white/10 mx-1"></div>
                <button className="p-2 hover:bg-white/5 rounded-lg text-gray-400" title="A4 Retrato"><Maximize2 size={18}/></button>
            </div>

            <div 
                ref={containerRef}
                className="flex-1 overflow-hidden flex items-center justify-center p-10 cursor-crosshair bg-neutral-900"
                style={{
                    backgroundImage: 'radial-gradient(#ffffff05 1px, transparent 1px)',
                    backgroundSize: '20px 20px'
                }}
            >
                <div 
                    className="relative shadow-2xl transition-transform duration-75 origin-center"
                    style={{ 
                        transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
                    }}
                >
                    <canvas 
                        ref={bgCanvasRef} 
                        className="rounded shadow-lg bg-white"
                        style={{ pointerEvents: 'none' }}
                    />
                    <canvas 
                        ref={canvasRef}
                        className="absolute inset-0 z-10 rounded"
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                    />
                    
                    {selectedTool === 'ruler' && (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 cursor-move">
                            <div className="w-96 h-12 bg-yellow-400/80 backdrop-blur-sm border-2 border-yellow-600 rounded flex items-center px-4 shadow-xl">
                                <div className="absolute inset-x-0 top-0 flex justify-between px-1">
                                    {Array.from({length: 20}).map((_, i) => (
                                        <div key={i} className={`w-px ${i % 5 === 0 ? 'h-3 bg-yellow-900' : 'h-1.5 bg-yellow-800'}`}></div>
                                    ))}
                                </div>
                                <span className="text-[10px] font-bold text-yellow-900">RÉGUA (30cm)</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

interface ToolButtonProps {
    icon: React.ReactNode;
    active?: boolean;
    onClick: () => void;
    title: string;
    className?: string;
}

const ToolButton: React.FC<ToolButtonProps> = ({ icon, active, onClick, title, className = '' }) => (
    <button
        onClick={onClick}
        title={title}
        className={`p-3 rounded-lg transition-all ${active ? 'bg-emerald-500 text-white shadow-lg' : 'bg-white/5 text-gray-400 hover:bg-white/10'} ${className}`}
    >
        {icon}
    </button>
);
