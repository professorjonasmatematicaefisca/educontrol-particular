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
    Clipboard,
    Save,
    GripVertical,
    Hand,
    Trash,
    PenLine,
    ArrowRight,
    CheckCircle
} from 'lucide-react';
import { UserRole, Discipline } from './types';
import { SupabaseService } from './services/supabaseService';
import * as pdfjs from 'pdfjs-dist';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

// pdfjs worker setup
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface WhiteboardProps {
    onShowToast: (msg: string) => void;
    onClose: () => void;
    userEmail: string;
    userRole: UserRole;
    activeClassId?: string;
    initialDisciplineId?: string;
}

type Tool = 'pen' | 'eraser' | 'highlighter' | 'text' | 'rect' | 'circle' | 'line' | 'select' | 'lasso' | 'pan' | 'compass' | 'ruler' | 'image';

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

export const Whiteboard: React.FC<WhiteboardProps> = ({ onShowToast, onClose, userEmail, userRole, activeClassId, initialDisciplineId }) => {
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
    
    // History for Undo/Redo - Multi-page support
    const [pages, setPages] = useState<DrawElement[][]>([[]]);
    const [currentPageIndex, setCurrentPageIndex] = useState(0);
    const [redoStacks, setRedoStacks] = useState<DrawElement[][]>([[]]);
    
    const elements = pages[currentPageIndex] || [];
    const redoStack = redoStacks[currentPageIndex] || [];

    const [selectedElements, setSelectedElements] = useState<DrawElement[]>([]);
    const selectedElement = selectedElements[0] || null;
    const [toolbarPos, setToolbarPos] = useState({ x: 20, y: 150 });
    const [isDraggingToolbar, setIsDraggingToolbar] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    
    // Interaction state
    const [isDrawing, setIsDrawing] = useState(false);
    const [isPanning, setIsPanning] = useState(false);
    const [currentElement, setCurrentElement] = useState<DrawElement | null>(null);
    const [lastPoint, setLastPoint] = useState<Point | null>(null);

    // Tools visibility
    const [showDisciplinePicker, setShowDisciplinePicker] = useState(true);
    const [showStartModal, setShowStartModal] = useState(!!activeClassId);

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
                            setPages(prev => {
                                const newPages = [...prev];
                                newPages[currentPageIndex] = [...(newPages[currentPageIndex] || []), newEl];
                                return newPages;
                            });
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
                        setPages(prev => {
                            const newPages = [...prev];
                            newPages[currentPageIndex] = [...(newPages[currentPageIndex] || []), newEl];
                            return newPages;
                        });
                        onShowToast('Texto colado com sucesso!');
                    });
                }
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault();
                handleUndo();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
                e.preventDefault();
                handleRedo();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                handleSave();
            }
        };

        const handleWheel = (e: WheelEvent) => {
            if (e.ctrlKey) {
                e.preventDefault();
                const delta = e.deltaY > 0 ? -0.1 : 0.1;
                setZoom(z => Math.max(0.2, Math.min(5, z + delta)));
            }
        };

        window.addEventListener('paste', handlePaste);
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('wheel', handleWheel, { passive: false });
        
        return () => {
            window.removeEventListener('paste', handlePaste);
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('wheel', handleWheel);
        };
    };

    const [showFinishModal, setShowFinishModal] = useState(false);
    const [finalPaymentDueDate, setFinalPaymentDueDate] = useState(new Date().toISOString().split('T')[0]);

    const handleSave = async (isAuto = false, paymentDueDate?: string) => {
        if (!activeClassId) {
            onShowToast('Inicie uma aula para salvar!');
            return false;
        }

        try {
            onShowToast(isAuto ? 'Finalizando e salvando aula...' : 'Gerando PDF da aula...');
            
            const pdf = new jsPDF('p', 'mm', 'a4');
            const canvas = canvasRef.current;
            const bgCanvas = bgCanvasRef.current;
            if (!canvas || !bgCanvas) return false;

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            // Create a temporary high-res canvas for flat rendering
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = canvas.width;
            tempCanvas.height = canvas.height;
            const tCtx = tempCanvas.getContext('2d')!;

            for (let i = 0; i < pages.length; i++) {
                if (i > 0) pdf.addPage();
                
                tCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
                
                // 1. Draw Background
                if (selectedDiscipline?.whiteboardBackgroundUrl) {
                    try {
                        const url = `${selectedDiscipline.whiteboardBackgroundUrl}${selectedDiscipline.whiteboardBackgroundUrl.includes('?') ? '&' : '?'}t=${Date.now()}`;
                        const loadingTask = pdfjs.getDocument({
                            url: url,
                            cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.6.172/cmaps/',
                            cMapPacked: true,
                        });
                        const pdfDoc = await loadingTask.promise;
                        const page = await pdfDoc.getPage(1);
                        const viewport = page.getViewport({ scale: tempCanvas.width / page.getViewport({scale: 1}).width });
                        await page.render({ canvasContext: tCtx, viewport }).promise;
                    } catch (e) {
                        renderGrid(tCtx, tempCanvas.width, tempCanvas.height);
                    }
                } else {
                    renderGrid(tCtx, tempCanvas.width, tempCanvas.height);
                }

                // 2. Draw elements for this page
                const dpr = window.devicePixelRatio || 1;
                tCtx.save();
                tCtx.scale(dpr, dpr);
                pages[i].forEach(el => drawElement(tCtx, el));
                tCtx.restore();

                // 3. Add to PDF
                const imgData = tempCanvas.toDataURL('image/jpeg', 0.92);
                pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
                console.log(`Página ${i+1} renderizada no PDF`);
            }

            const pdfBlob = pdf.output('blob');
            const file = new File([pdfBlob], `aula_${activeClassId}_${Date.now()}.pdf`, { type: 'application/pdf' });
            
            const pdfUrl = await SupabaseService.uploadPDF(file);
            if (pdfUrl) {
                const success = await SupabaseService.updateScheduledClassStatus(activeClassId, 'COMPLETED', { 
                    pdfUrl,
                    paymentStatus: 'PENDING',
                    paymentDueDate: paymentDueDate || new Date().toISOString().split('T')[0]
                });
                if (success) {
                    onShowToast('Aula salva e concluída com sucesso!');
                    return true;
                } else {
                    onShowToast('PDF enviado, mas erro ao vincular à aula.');
                    return false;
                }
            } else {
                onShowToast('Erro ao enviar PDF para o servidor.');
                return false;
            }
        } catch (err) {
            console.error("Error saving whiteboard:", err);
            onShowToast('Erro ao salvar aula.');
            return false;
        }
    };

    const handleFinishClass = async () => {
        const saved = await handleSave(true, finalPaymentDueDate);
        if (saved) {
            setShowFinishModal(false);
            onClose();
        }
    };

    const loadDisciplines = async () => {
        const data = await SupabaseService.getDisciplines();
        setDisciplines(data);
        
        // If initialDisciplineId is provided, set it.
        if (initialDisciplineId) {
            const discipline = data.find(d => d.id === initialDisciplineId);
            if (discipline) setSelectedDiscipline(discipline);
        }
    };

    // Initialize Canvas with proper High-DPI support and A4 aspect ratio
    useEffect(() => {
        const initCanvas = () => {
            const canvas = canvasRef.current;
            const bgCanvas = bgCanvasRef.current;
            const container = containerRef.current;
            if (!canvas || !bgCanvas || !container) return;

            const containerWidth = container.clientWidth - 40;
            const containerHeight = container.clientHeight - 40;

            // A4 Portrait: height = width * 1.414.
            // User wants 100% vertical occupation if possible.
            let height = containerHeight;
            let width = height / 1.414;
            
            if (width > containerWidth) {
                width = containerWidth;
                height = width * 1.414;
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
                // Improved PDF loading with cache buster
                const url = `${selectedDiscipline.whiteboardBackgroundUrl}${selectedDiscipline.whiteboardBackgroundUrl.includes('?') ? '&' : '?'}t=${Date.now()}`;
                const loadingTask = pdfjs.getDocument({
                    url: url,
                    cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.6.172/cmaps/',
                    cMapPacked: true,
                });
                const pdf = await loadingTask.promise;
                const page = await pdf.getPage(1);
                
                const dpr = window.devicePixelRatio || 1;
                const viewport = page.getViewport({ scale: 1 });
                
                // Calculate scale to fit our background canvas exactly
                const scale = (bgCanvas.width / dpr) / viewport.width;
                const scaledViewport = page.getViewport({ scale: scale * dpr });
                
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
    }, [elements, currentElement, zoom, pan]);

    useEffect(() => {
        renderAllElements();
    }, [elements, currentElement, renderAllElements, zoom, pan]);
    
    // Toolbar Drag Logic
    const handleToolbarMouseDown = (e: React.MouseEvent) => {
        setIsDraggingToolbar(true);
        setDragOffset({
            x: e.clientX - toolbarPos.x,
            y: e.clientY - toolbarPos.y
        });
    };
    
    useEffect(() => {
        if (!isDraggingToolbar) return;
        
        const handleMouseMove = (e: MouseEvent) => {
            setToolbarPos({
                x: e.clientX - dragOffset.x,
                y: e.clientY - dragOffset.y
            });
        };
        
        const handleMouseUp = () => setIsDraggingToolbar(false);
        
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDraggingToolbar, dragOffset]);

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
                    
                    if (el.points.length < 3) {
                        el.points.forEach(p => ctx.lineTo(p.x, p.y));
                    } else {
                        // Smoothing with Quadratic Curves (Midpoint technique)
                        let i;
                        for (i = 1; i < el.points.length - 2; i++) {
                            const xc = (el.points[i].x + el.points[i + 1].x) / 2;
                            const yc = (el.points[i].y + el.points[i + 1].y) / 2;
                            ctx.quadraticCurveTo(el.points[i].x, el.points[i].y, xc, yc);
                        }
                        // For the last 2 points
                        ctx.quadraticCurveTo(
                            el.points[i].x,
                            el.points[i].y,
                            el.points[i + 1].x,
                            el.points[i + 1].y
                        );
                    }
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

        // Highlight if selected
        const isSelected = selectedElements.includes(el);
        if (isSelected) {
            ctx.strokeStyle = '#10b981'; // emerald-500
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            // Simplified bounding box highlight
            if (el.x !== undefined && el.y !== undefined) {
                const w = el.width || 0;
                const h = el.height || 0;
                ctx.strokeRect(el.x - 5, el.y - 5, (w || 10) + 10, (h || 10) + 10);
            } else if (el.points && el.points.length > 0) {
                // For lines/pen, find bounds
                const minX = Math.min(...el.points.map(p => p.x));
                const maxX = Math.max(...el.points.map(p => p.x));
                const minY = Math.min(...el.points.map(p => p.y));
                const maxY = Math.max(...el.points.map(p => p.y));
                ctx.strokeRect(minX - 5, minY - 5, (maxX - minX) + 10, (maxY - minY) + 10);
            }
            ctx.setLineDash([]);
        }

        ctx.restore();
    };

    const isPointInLasso = (point: Point, lassoPoints: Point[]) => {
        // Point-in-polygon (ray casting)
        let inside = false;
        for (let i = 0, j = lassoPoints.length - 1; i < lassoPoints.length; j = i++) {
            const xi = lassoPoints[i].x, yi = lassoPoints[i].y;
            const xj = lassoPoints[j].x, yj = lassoPoints[j].y;
            const intersect = ((yi > point.y) !== (yj > point.y))
                && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    };

    const isPointNearLine = (x: number, y: number, p1: {x: number, y: number}, p2: {x: number, y: number}, threshold: number) => {
        const L2 = (p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2;
        if (L2 === 0) return Math.sqrt((x - p1.x) ** 2 + (y - p1.y) ** 2) <= threshold;
        let t = ((x - p1.x) * (p2.x - p1.x) + (y - p1.y) * (p2.y - p1.y)) / L2;
        t = Math.max(0, Math.min(1, t));
        const dist = Math.sqrt((x - (p1.x + t * (p2.x - p1.x))) ** 2 + (y - (p1.y + t * (p2.y - p1.y))) ** 2);
        return dist <= threshold;
    };

    const getElementAt = (x: number, y: number): DrawElement | null => {
        // Search backwards (topmost first)
        for (let i = elements.length - 1; i >= 0; i--) {
            const el = elements[i];
            if (el.points && el.points.length > 1) {
                for (let j = 0; j < el.points.length - 1; j++) {
                    if (isPointNearLine(x, y, el.points[j], el.points[j+1], 10)) return el;
                }
            }
            if (el.x !== undefined && el.y !== undefined) {
                const w = el.width || 20;
                const h = el.height || 20;
                if (x >= el.x && x <= el.x + w && y >= el.y && y <= el.y + h) return el;
            }
        }
        return null;
    };

    const getCoordinates = (e: React.MouseEvent | MouseEvent) => {
        if (!canvasRef.current) return { x: 0, y: 0 };
        const rect = canvasRef.current.getBoundingClientRect();
        
        // Accurate coordinates relative to canvas taking scale into account
        const x = (e.clientX - rect.left) / zoom;
        const y = (e.clientY - rect.top) / zoom;
        
        return { x, y };
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        const { x, y } = getCoordinates(e);

        if (selectedTool === 'pan') {
            setIsPanning(true);
            setLastPoint({ x: e.clientX, y: e.clientY });
            return;
        }

        if (selectedTool === 'select') {
            const el = getElementAt(x, y);
            setSelectedElements(el ? [el] : []);
            if (el) {
                setIsDrawing(true); // Reusing for "isMoving"
                setLastPoint({ x, y });
            }
            return;
        }

        if (selectedTool === 'lasso') {
            setIsDrawing(true);
            setCurrentElement({
                type: 'lasso',
                points: [{ x, y }],
                color: '#10b981',
                size: 1
            });
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
        const { x, y } = getCoordinates(e);

        if (isPanning && lastPoint) {
            const dx = e.clientX - lastPoint.x;
            const dy = e.clientY - lastPoint.y;
            setPan(p => ({ x: p.x + dx / zoom, y: p.y + dy / zoom }));
            setLastPoint({ x: e.clientX, y: e.clientY });
            return;
        }

        if (selectedTool === 'select' && isDrawing && selectedElements.length > 0 && lastPoint) {
            const dx = x - lastPoint.x;
            const dy = y - lastPoint.y;
            
            setPages(prev => {
                const newPages = [...prev];
                const currentPage = [...newPages[currentPageIndex]];
                
                selectedElements.forEach(selEl => {
                    const idx = currentPage.findIndex(el => el === selEl);
                    if (idx !== -1) {
                        const updatedEl = { ...selEl };
                        if (updatedEl.points) {
                            updatedEl.points = updatedEl.points.map(p => ({ x: p.x + dx, y: p.y + dy }));
                        }
                        if (updatedEl.x !== undefined) updatedEl.x += dx;
                        if (updatedEl.y !== undefined) updatedEl.y += dy;
                        
                        currentPage[idx] = updatedEl;
                        
                        // Update selectedElements as well
                        setSelectedElements(prevSel => prevSel.map(p => p === selEl ? updatedEl : p));
                    }
                });
                
                newPages[currentPageIndex] = currentPage;
                return newPages;
            });

            setLastPoint({ x, y });
            return;
        }

        if (selectedTool === 'lasso' && isDrawing && currentElement) {
            setCurrentElement({
                ...currentElement,
                points: [...(currentElement.points || []), { x, y }]
            });
            return;
        }

        if (!isDrawing || !currentElement) return;

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

        if (selectedTool === 'select') {
            setIsDrawing(false);
            setLastPoint(null);
            return;
        }

        if (selectedTool === 'lasso') {
            if (currentElement?.points) {
                const found = elements.filter(el => {
                    if (el.x !== undefined && el.y !== undefined) {
                        return isPointInLasso({ x: el.x, y: el.y }, currentElement.points!);
                    }
                    if (el.points && el.points.length > 0) {
                        return el.points.some(p => isPointInLasso(p, currentElement.points!));
                    }
                    return false;
                });
                setSelectedElements(found);
            }
            setCurrentElement(null);
            setIsDrawing(false);
            return;
        }

        if (!isDrawing || !currentElement) return;
        
        setPages(prev => {
            const newPages = [...prev];
            newPages[currentPageIndex] = [...(newPages[currentPageIndex] || []), currentElement];
            return newPages;
        });
        setCurrentElement(null);
        setIsDrawing(false);
        setRedoStacks(prev => {
            const newStacks = [...prev];
            newStacks[currentPageIndex] = [];
            return newStacks;
        });
    };

    const deleteSelected = () => {
        if (selectedElements.length > 0) {
            setPages(prev => {
                const newPages = [...prev];
                newPages[currentPageIndex] = newPages[currentPageIndex].filter(el => !selectedElements.includes(el));
                return newPages;
            });
            setSelectedElements([]);
        }
    };

    const handleUndo = () => {
        if (elements.length === 0) return;
        const last = elements[elements.length - 1];
        
        setRedoStacks(prev => {
            const newStacks = [...prev];
            newStacks[currentPageIndex] = [...(newStacks[currentPageIndex] || []), last];
            return newStacks;
        });

        setPages(prev => {
            const newPages = [...prev];
            newPages[currentPageIndex] = newPages[currentPageIndex].slice(0, -1);
            return newPages;
        });
    };

    const handleRedo = () => {
        if (redoStack.length === 0) return;
        const last = redoStack[redoStack.length - 1];

        setPages(prev => {
            const newPages = [...prev];
            newPages[currentPageIndex] = [...(newPages[currentPageIndex] || []), last];
            return newPages;
        });

        setRedoStacks(prev => {
            const newStacks = [...prev];
            newStacks[currentPageIndex] = newStacks[currentPageIndex].slice(0, -1);
            return newStacks;
        });
    };

    const clearCanvas = () => {
        if (confirm('Limpar toda a lousa?')) {
            setPages(prev => {
                const newPages = [...prev];
                newPages[currentPageIndex] = [];
                return newPages;
            });
            setRedoStacks(prev => {
                const newStacks = [...prev];
                newStacks[currentPageIndex] = [];
                return newStacks;
            });
        }
    };

    const addPage = () => {
        setPages([...pages, []]);
        setRedoStacks([...redoStacks, []]);
        setCurrentPageIndex(pages.length);
        onShowToast('Nova página adicionada!');
    };

    const selectTool = (tool: DrawElement['type']) => {
        setSelectedTool(tool);
        if (tool === 'pen') setBrushSize(3);
        if (tool === 'highlighter') setBrushSize(20);
        if (tool === 'eraser') setBrushSize(40);
    };

    const renderToolbar = () => (
        <div 
            className="fixed z-[100] transition-shadow duration-300"
            style={{ 
                left: `${toolbarPos.x}px`, 
                top: `${toolbarPos.y}px`,
                cursor: isDraggingToolbar ? 'grabbing' : 'default'
            }}
        >
            <div className="bg-[#0f172a]/95 backdrop-blur-xl border border-slate-700/50 p-4 rounded-[2.5rem] shadow-2xl flex flex-col items-center gap-4 group">
                {/* Drag Handle */}
                <div 
                    onMouseDown={handleToolbarMouseDown}
                    className="w-full flex justify-center p-1 cursor-grab active:cursor-grabbing hover:bg-white/5 rounded-t-2xl text-slate-500 border-b border-slate-800 pb-2"
                >
                    <GripVertical size={20} className="rotate-90" />
                </div>

                <div className="flex flex-col items-center gap-2 border-b border-slate-800 pb-4">
                    <ToolButton icon={<PenLine size={24} />} active={selectedTool === 'pen'} onClick={() => selectTool('pen')} title="Caneta (Ctrl+P)" />
                    <ToolButton icon={<Highlighter size={24} />} active={selectedTool === 'highlighter'} onClick={() => selectTool('highlighter')} title="Marca Texto" />
                    <ToolButton icon={<Eraser size={24} />} active={selectedTool === 'eraser'} onClick={() => selectTool('eraser')} title="Borracha" />
                </div>

                <div className="flex flex-col items-center gap-2 border-b border-slate-800 pb-4">
                    <ToolButton icon={<Square size={22} />} active={selectedTool === 'rect'} onClick={() => setSelectedTool('rect')} title="Retângulo" />
                    <ToolButton icon={<Circle size={22} />} active={selectedTool === 'circle'} onClick={() => setSelectedTool('circle')} title="Círculo" />
                    <ToolButton icon={<Minus size={22} />} active={selectedTool === 'line'} onClick={() => setSelectedTool('line')} title="Linha" />
                </div>

                <div className="flex flex-col items-center gap-2 border-b border-slate-800 pb-4">
                    <ToolButton icon={<Type size={22} />} active={selectedTool === 'text'} onClick={() => setSelectedTool('text')} title="Texto" />
                    <ToolButton icon={<RulerIcon size={22} />} active={selectedTool === 'ruler'} onClick={() => setSelectedTool('ruler')} title="Régua" />
                    <ToolButton icon={<Compass size={22} />} active={selectedTool === 'compass'} onClick={() => setSelectedTool('compass')} title="Compasso" />
                </div>

                <div className="flex flex-col items-center gap-2 border-b border-slate-800 pb-4">
                    <ToolButton icon={<MousePointer2 size={22} />} active={selectedTool === 'select'} onClick={() => setSelectedTool('select')} title="Selecionar" />
                    <ToolButton icon={<ArrowRight size={22} className="rotate-45" />} active={selectedTool === 'lasso'} onClick={() => setSelectedTool('lasso')} title="Laço de Seleção" />
                    <ToolButton icon={<Hand size={22} />} active={selectedTool === 'pan'} onClick={() => setSelectedTool('pan')} title="Mover Tela" />
                    {selectedElements.length > 0 && (
                        <ToolButton icon={<Trash2 size={22} />} onClick={deleteSelected} title="Deletar Selecionado" className="text-red-400 hover:bg-red-500/10" />
                    )}
                </div>

                <div className="flex flex-col items-center gap-2 border-b border-slate-800 pb-4">
                    <ToolButton icon={<Undo size={22} />} onClick={handleUndo} title="Desfazer (Ctrl+Z)" />
                    <ToolButton icon={<Redo size={22} />} onClick={handleRedo} title="Refazer (Ctrl+Y)" />
                    <ToolButton icon={<Trash size={22} />} onClick={clearCanvas} title="Limpar Tudo" />
                </div>

                <div className="flex flex-col items-center gap-4 py-2">
                    <div className="grid grid-cols-2 gap-2">
                        {['#ffffff', '#ef4444', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#000000'].map(c => (
                            <button key={c} onClick={() => setColor(c)} className={`w-6 h-6 rounded-full border border-white/10 transition-transform active:scale-95 ${color === c ? 'scale-125 shadow-lg border-white' : ''}`} style={{ backgroundColor: c }} />
                        ))}
                    </div>
                    
                    <div className="flex flex-col items-center gap-2">
                        <div className="text-[10px] font-bold text-slate-500 uppercase">Tamanho</div>
                        <div className="flex gap-1 mb-2">
                            {[2, 5, 10, 20].map(sz => (
                                <button 
                                    key={sz} 
                                    onClick={() => setBrushSize(sz)}
                                    className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold transition-all border ${brushSize === sz ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                                >
                                    {sz}
                                </button>
                            ))}
                        </div>
                        <input 
                            type="range" 
                            min="1" 
                            max="50" 
                            value={brushSize} 
                            onChange={(e) => setBrushSize(parseInt(e.target.value))} 
                            className="w-24 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 -rotate-90 my-8" 
                        />
                        <div className="text-xs font-mono text-emerald-500">{brushSize}px</div>
                    </div>
                </div>

                <div className="flex flex-col gap-2 w-full">
                    <button 
                        onClick={() => handleSave()} 
                        title="Salvar PDF (Ctrl+S)"
                        className="w-full bg-slate-800 hover:bg-slate-700 text-white p-3 rounded-2xl transition-all flex items-center justify-center gap-2"
                    >
                        <Save size={20} />
                    </button>
                    <button 
                        onClick={() => setShowFinishModal(true)} 
                        title="Finalizar Aula e Salvar"
                        className="w-full bg-emerald-500 hover:bg-emerald-400 text-white p-4 rounded-2xl transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        <CheckCircle size={24} />
                        <span className="text-[10px] font-black uppercase">Concluir</span>
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="h-[calc(100vh-80px)] flex bg-[#0f172a] relative">
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

            {renderToolbar()}

            <div className="absolute right-6 bottom-6 flex items-center gap-3 bg-[#1e293b] p-2 rounded-xl border border-white/10 shadow-2xl z-20">
                <div className="flex items-center gap-1 bg-white/5 rounded-lg px-2 mr-2">
                    <button onClick={() => setCurrentPageIndex(p => Math.max(0, p - 1))} disabled={currentPageIndex === 0} className="p-2 text-gray-400 hover:text-white disabled:opacity-30"><ChevronLeft size={18}/></button>
                    <span className="text-xs font-bold text-emerald-500 px-2">Pág {currentPageIndex + 1} / {pages.length}</span>
                    <button onClick={() => setCurrentPageIndex(p => Math.min(pages.length - 1, p + 1))} disabled={currentPageIndex === pages.length - 1} className="p-2 text-gray-400 hover:text-white disabled:opacity-30"><ChevronRight size={18}/></button>
                    <button onClick={addPage} className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-lg ml-1" title="Nova Página"><Maximize2 size={18}/></button>
                </div>
                <button onClick={() => setZoom(z => Math.max(0.2, z - 0.1))} className="p-2 hover:bg-white/5 rounded-lg text-gray-400"><ZoomOut size={18}/></button>
                <span className="text-xs font-mono text-gray-400 w-12 text-center">{Math.round(zoom * 100)}%</span>
                <button onClick={() => setZoom(z => Math.min(5, z + 0.1))} className="p-2 hover:bg-white/5 rounded-lg text-gray-400"><ZoomIn size={18}/></button>
                <div className="w-px h-6 bg-white/10 mx-1"></div>
                <button className="p-2 hover:bg-white/5 rounded-lg text-gray-400" title="Reiniciar Zoom" onClick={() => { setZoom(1); setPan({x:0, y:0}); }}><Minimize2 size={18}/></button>
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
            {showStartModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
                    <div className="bg-[#0f172a] w-full max-w-lg rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-slate-800">
                            <h3 className="text-xl font-black text-white mb-1 uppercase tracking-tight">Iniciar Aula Digital</h3>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Confirme a disciplina para carregar o layout</p>
                        </div>
                        <div className="p-8 space-y-4 max-h-[400px] overflow-y-auto">
                            {disciplines.map(d => (
                                <button
                                    key={d.id}
                                    onClick={() => {
                                        setSelectedDiscipline(d);
                                        setShowStartModal(false);
                                    }}
                                    className={`w-full p-6 text-left rounded-3xl border transition-all flex items-center justify-between group ${selectedDiscipline?.id === d.id ? 'bg-emerald-500 border-emerald-400' : 'bg-slate-800/40 border-slate-700/50 hover:border-emerald-500/50 hover:bg-emerald-500/5'}`}
                                >
                                    <div>
                                        <div className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${selectedDiscipline?.id === d.id ? 'text-emerald-100' : 'text-emerald-500'}`}>Disciplina</div>
                                        <div className={`text-lg font-black ${selectedDiscipline?.id === d.id ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>{d.displayName || d.name}</div>
                                    </div>
                                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                                        <ArrowRight className={selectedDiscipline?.id === d.id ? 'text-white' : 'text-slate-500'} size={20} />
                                    </div>
                                </button>
                            ))}
                        </div>
                        <div className="p-8 bg-slate-900/50 flex justify-end">
                            <button onClick={() => setShowStartModal(false)} className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all">Pular</button>
                        </div>
                    </div>
                </div>
            )}
            {showFinishModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
                    <div className="bg-[#0f172a] w-full max-w-md rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-slate-800 bg-emerald-500/10">
                            <h3 className="text-xl font-black text-white mb-1 uppercase tracking-tight flex items-center gap-3">
                                <CheckCircle className="text-emerald-500" /> Finalizar Aula
                            </h3>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">A lousa será salva e a aula concluída</p>
                        </div>
                        <div className="p-8 space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Previsão de Pagamento</label>
                                <input 
                                    type="date"
                                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                                    value={finalPaymentDueDate}
                                    onChange={(e) => setFinalPaymentDueDate(e.target.value)}
                                />
                            </div>
                            
                            <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                                <p className="text-[10px] text-emerald-400 font-bold leading-relaxed text-center uppercase tracking-wide">
                                    Ao confirmar, um lançamento pendente será criado no seu financeiro pessoal.
                                </p>
                            </div>
                        </div>
                        <div className="p-8 flex gap-4">
                            <button 
                                onClick={() => setShowFinishModal(false)}
                                className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-white font-black rounded-2xl text-xs uppercase tracking-widest transition-all"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleFinishClass}
                                className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95"
                            >
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}
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
