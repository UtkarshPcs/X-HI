import React, { useState, useRef, useEffect } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { jsPDF } from 'jspdf';
import { Camera, Image as ImageIcon, X, Plus, RotateCw, Trash2, ArrowRight, FileText, Check, Loader2 } from 'lucide-react';

// --- Utility Functions for Image Processing ---

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = e => reject(e);
    reader.readAsDataURL(file);
  });
}

function createImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = error => reject(error);
    image.src = url;
  });
}

async function getCroppedImg(imageSrc, crop, rotation = 0) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) return null;

  const rotRad = (rotation * Math.PI) / 180;
  const bBoxWidth = Math.abs(Math.cos(rotRad) * image.width) + Math.abs(Math.sin(rotRad) * image.height);
  const bBoxHeight = Math.abs(Math.sin(rotRad) * image.width) + Math.abs(Math.cos(rotRad) * image.height);

  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.translate(-image.width / 2, -image.height / 2);
  ctx.drawImage(image, 0, 0);

  if (!crop || !crop.width || !crop.height) {
    return canvas.toDataURL('image/jpeg', 0.85);
  }

  const croppedCanvas = document.createElement('canvas');
  const croppedCtx = croppedCanvas.getContext('2d');

  croppedCanvas.width = crop.width;
  croppedCanvas.height = crop.height;

  croppedCtx.drawImage(
    canvas,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    crop.width,
    crop.height
  );

  return croppedCanvas.toDataURL('image/jpeg', 0.85);
}

// --- OpenCV Filter Processing ---
async function applyFilter(imageSrc, filterName) {
  return new Promise(async (resolve, reject) => {
    try {
      const img = await createImage(imageSrc);
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      const cv = window.cv;
      const src = cv.imread(canvas);
      const dst = new cv.Mat();

      if (filterName === 'Natural') {
        src.convertTo(dst, -1, 1.05, 5);
      } 
      else if (filterName === 'B&W Scan') {
        cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY);
        cv.adaptiveThreshold(dst, dst, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 21, 15);
        cv.cvtColor(dst, dst, cv.COLOR_GRAY2RGBA);
      } 
      else if (filterName === 'Sharp') {
        const blurred = new cv.Mat();
        cv.GaussianBlur(src, blurred, new cv.Size(0, 0), 3);
        cv.addWeighted(src, 1.5, blurred, -0.5, 0, dst);
        blurred.delete();
      } 
      else if (filterName === 'Clean') {
        const blurred = new cv.Mat();
        cv.GaussianBlur(src, blurred, new cv.Size(51, 51), 0);
        const srcFloat = new cv.Mat();
        const blurFloat = new cv.Mat();
        src.convertTo(srcFloat, cv.CV_32F);
        blurred.convertTo(blurFloat, cv.CV_32F);
        
        const divided = new cv.Mat();
        cv.divide(srcFloat, blurFloat, divided, 255);
        
        divided.convertTo(dst, cv.CV_8U, 1.2, -10);
        
        srcFloat.delete();
        blurFloat.delete();
        blurred.delete();
        divided.delete();
      } 
      else if (filterName === 'Vivid Light') {
        const blurred = new cv.Mat();
        cv.GaussianBlur(src, blurred, new cv.Size(31, 31), 0);
        
        const srcFloat = new cv.Mat();
        const blurFloat = new cv.Mat();
        src.convertTo(srcFloat, cv.CV_32F);
        blurred.convertTo(blurFloat, cv.CV_32F);
        
        const divided = new cv.Mat();
        cv.divide(srcFloat, blurFloat, divided, 255);
        
        divided.convertTo(dst, cv.CV_8U, 1.4, -40);
        
        srcFloat.delete();
        blurFloat.delete();
        blurred.delete();
        divided.delete();
      } 
      else {
        src.copyTo(dst);
      }

      cv.imshow(canvas, dst);
      // Generate high-quality JPEG to keep text sharp
      const resultUrl = canvas.toDataURL('image/jpeg', 0.92);
      
      src.delete();
      dst.delete();
      resolve(resultUrl);
    } catch (e) {
      reject(e);
    }
  });
}

// --- Sortable Item Component ---
function SortableItem({ id, page, index, onRemove, onRotate }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="scanner-page-card">
      <div className="scanner-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <span className="scanner-page-num" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Page {index + 1}</span>
        <button type="button" onClick={() => onRemove(id)} className="scanner-icon-btn error" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '0.2rem' }}><Trash2 size={16}/></button>
      </div>
      <div 
        {...attributes} 
        {...listeners} 
        className="scanner-page-thumb"
        style={{ padding: '0.5rem', cursor: 'grab', display: 'flex', justifyContent: 'center', background: '#000', borderRadius: '4px', position: 'relative' }}
      >
        <img src={page.imageSrc} alt={`Page ${index + 1}`} style={{ maxWidth: '100%', height: '180px', objectFit: 'contain', opacity: page.status === 'pending' ? 0.3 : 1 }} />
        {page.status === 'pending' && (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: '0.75rem', marginTop: '4px' }}>Processing</span>
          </div>
        )}
      </div>
      <div className="scanner-page-footer" style={{ textAlign: 'center', marginTop: '0.5rem' }}>
        <button type="button" disabled={page.status === 'pending'} onClick={() => onRotate(id)} style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)', padding: '0.4rem 0.6rem', borderRadius: '4px', cursor: page.status === 'pending' ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-primary)', width: '100%', justifyContent: 'center', opacity: page.status === 'pending' ? 0.5 : 1 }}><RotateCw size={14} /> Rotate</button>
      </div>
    </div>
  );
}

// --- Main Scanner Component ---
export default function NotesScanner({ onPDFGenerated }) {
  const [pages, setPages] = useState([]); // { id, rawImageSrc, imageSrc, status: 'pending'|'done'|'error' }
  
  // OpenCV Loader
  const [cvLoaded, setCvLoaded] = useState(false);
  useEffect(() => {
    if (window.cv && window.cv.Mat) {
      setCvLoaded(true);
      return;
    }
    if (document.getElementById('opencv-script')) return;
    
    const script = document.createElement('script');
    script.id = 'opencv-script';
    script.src = 'https://docs.opencv.org/4.8.0/opencv.js';
    script.async = true;
    script.onload = () => {
      const checkCv = setInterval(() => {
        if (window.cv && window.cv.Mat) {
          clearInterval(checkCv);
          setCvLoaded(true);
        }
      }, 100);
    };
    document.body.appendChild(script);
  }, []);

  // Queue state
  const [rawImageQueue, setRawImageQueue] = useState([]);
  const rawImageSrc = rawImageQueue.length > 0 ? rawImageQueue[0] : null;

  // Cropper state
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState(null);
  const [rotation, setRotation] = useState(0);
  const imgRef = useRef(null);
  const fileInputRef = useRef(null);

  // Global Filter state
  const [globalFilter, setGlobalFilter] = useState('B&W Scan');
  const FILTERS = ['B&W Scan', 'Vivid Light', 'Clean', 'Sharp', 'Natural'];

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // --- Background Processing Effect ---
  useEffect(() => {
    if (!cvLoaded) return;
    
    const pendingPageIndex = pages.findIndex(p => p.status === 'pending');
    if (pendingPageIndex === -1) return; 

    let isMounted = true;
    
    setTimeout(async () => {
      const page = pages[pendingPageIndex];
      try {
        const resultSrc = await applyFilter(page.rawImageSrc, globalFilter);
        if (isMounted) {
          setPages(prev => {
            const next = [...prev];
            if (next[pendingPageIndex] && next[pendingPageIndex].id === page.id) {
               next[pendingPageIndex] = { ...page, imageSrc: resultSrc, status: 'done' };
            }
            return next;
          });
        }
      } catch (e) {
        console.error('Failed to filter', e);
        if (isMounted) {
          setPages(prev => {
            const next = [...prev];
            if (next[pendingPageIndex] && next[pendingPageIndex].id === page.id) {
               next[pendingPageIndex] = { ...page, status: 'error', imageSrc: page.rawImageSrc };
            }
            return next;
          });
        }
      }
    }, 50);

    return () => { isMounted = false; };
  }, [pages, cvLoaded, globalFilter]);

  function handleCaptureClick(capture = false) {
    if (fileInputRef.current) {
      if (capture) {
        fileInputRef.current.setAttribute('capture', 'environment');
        fileInputRef.current.removeAttribute('multiple');
      } else {
        fileInputRef.current.removeAttribute('capture');
        fileInputRef.current.setAttribute('multiple', 'multiple');
      }
      fileInputRef.current.click();
    }
  }

  async function handleFileSelect(e) {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const dataUrls = await Promise.all(files.map(fileToDataUrl));
      setRawImageQueue(prev => [...prev, ...dataUrls]);
      setRotation(0);
      setCrop(null);
    }
    e.target.value = '';
  }

  function onImageLoad(e) {
    const { width, height } = e.currentTarget;
    imgRef.current = e.currentTarget;
    const initialCrop = centerCrop(
      makeAspectCrop({ unit: '%', width: 90 }, width / height, width, height),
      width,
      height
    );
    setCrop(initialCrop);
  }

  async function handleNextCropper() {
    if (!rawImageSrc) return;
    try {
      let finalCrop = completedCrop;
      
      if (!finalCrop && imgRef.current) {
        const image = imgRef.current;
        finalCrop = {
          unit: 'px',
          x: (crop.x * image.naturalWidth) / 100,
          y: (crop.y * image.naturalHeight) / 100,
          width: (crop.width * image.naturalWidth) / 100,
          height: (crop.height * image.naturalHeight) / 100,
        };
      }

      if (finalCrop && imgRef.current && finalCrop.unit !== '%') {
        const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
        const scaleY = imgRef.current.naturalHeight / imgRef.current.height;
        finalCrop = {
          x: finalCrop.x * scaleX,
          y: finalCrop.y * scaleY,
          width: finalCrop.width * scaleX,
          height: finalCrop.height * scaleY,
        };
      }

      const processedDataUrl = await getCroppedImg(rawImageSrc, finalCrop, rotation);
      if (processedDataUrl) {
        setPages(prev => [...prev, { 
          id: `page-${Date.now()}-${Math.random()}`, 
          rawImageSrc: processedDataUrl,
          imageSrc: processedDataUrl, // temporary preview while processing
          status: 'pending'
        }]);
      }
      
      setRawImageQueue(prev => prev.slice(1));
      setRotation(0);
      setCrop(null);
    } catch (e) {
      console.error("Cropping failed:", e);
      alert("Failed to process image.");
    }
  }

  async function handleRotateRaw() {
    const newSrc = await getCroppedImg(rawImageSrc, null, 90);
    if (newSrc) {
      setRawImageQueue(prev => {
        const next = [...prev];
        next[0] = newSrc;
        return next;
      });
      setCrop(null); // Force crop recalculation on next render/load
    }
  }

  // --- Arrangement Handlers ---
  function handleDragEnd(event) {
    const { active, over } = event;
    if (active.id !== over.id) {
      setPages((items) => {
        const oldIndex = items.findIndex(i => i.id === active.id);
        const newIndex = items.findIndex(i => i.id === over.id);
        const newItems = [...items];
        const [removed] = newItems.splice(oldIndex, 1);
        newItems.splice(newIndex, 0, removed);
        return newItems;
      });
    }
  }

  function removePage(id) {
    setPages(prev => prev.filter(p => p.id !== id));
  }

  async function rotatePageArrangement(id) {
    const pageIndex = pages.findIndex(p => p.id === id);
    if (pageIndex === -1) return;
    const page = pages[pageIndex];
    // Rotate the RAW image and set it back to pending so filter reapplies cleanly
    const newRawSrc = await getCroppedImg(page.rawImageSrc, null, 90);
    if (newRawSrc) {
      setPages(prev => {
        const next = [...prev];
        next[pageIndex] = { ...page, rawImageSrc: newRawSrc, imageSrc: newRawSrc, status: 'pending' };
        return next;
      });
    }
  }

  async function generatePDF() {
    if (pages.length === 0) return;
    if (pages.some(p => p.status === 'pending')) {
      alert('Please wait for all pages to finish applying the filter before creating the PDF.');
      return;
    }
    
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      for (let i = 0; i < pages.length; i++) {
        const img = await createImage(pages[i].imageSrc);
        
        const imgRatio = img.width / img.height;
        const pageRatio = pageWidth / pageHeight;
        
        let finalWidth = pageWidth;
        let finalHeight = pageHeight;
        
        if (imgRatio > pageRatio) {
          finalHeight = pageWidth / imgRatio;
        } else {
          finalWidth = pageHeight * imgRatio;
        }
        
        const x = (pageWidth - finalWidth) / 2;
        const y = (pageHeight - finalHeight) / 2;

        if (i > 0) doc.addPage();
        // Use FAST compression to keep PDF size manageable for Vercel Blob limits
        doc.addImage(img, 'JPEG', x, y, finalWidth, finalHeight, undefined, 'FAST');
      }
      
      const pdfBlob = doc.output('blob');
      const pdfFile = new File([pdfBlob], 'scanned_notes.pdf', { type: 'application/pdf' });
      onPDFGenerated(pdfFile);
    } catch (e) {
      console.error("PDF Gen failed:", e);
      alert("Failed to generate PDF. Please try again.");
    }
  }

  return (
    <div className="notes-scanner-container" style={{ padding: '0.5rem 0' }}>
      <input 
        type="file" 
        accept="image/*" 
        style={{ display: 'none' }} 
        ref={fileInputRef} 
        onChange={handleFileSelect} 
      />

      {/* --- CROPPER STATE --- */}
      {rawImageSrc && (
        <div className="scanner-cropper-view">
          <div className="scanner-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h4 style={{ margin: 0, fontSize: '1.1rem' }}>Crop Page</h4>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {rawImageQueue.length > 1 && (
                <button type="button" style={{ padding: '0.4rem 0.8rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'transparent', color: '#ef4444', cursor: 'pointer' }} onClick={() => setRawImageQueue([])}>Cancel All</button>
              )}
              <button type="button" style={{ padding: '0.4rem 0.8rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer' }} onClick={() => { setRawImageQueue(prev => prev.slice(1)); setRotation(0); setCrop(null); }}>{rawImageQueue.length > 1 ? 'Skip' : 'Cancel'}</button>
              <button type="button" style={{ padding: '0.4rem 0.8rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={handleRotateRaw}><RotateCw size={14}/> Rotate</button>
              <button type="button" className="auth-btn primary" style={{ display: 'flex', alignItems: 'center', gap: '4px' }} onClick={handleNextCropper}>Next <ArrowRight size={14}/></button>
            </div>
          </div>
          <div className="scanner-cropper-workspace" style={{ background: '#000', padding: '1rem', borderRadius: '8px', display: 'flex', justifyContent: 'center', overflow: 'hidden' }}>
            <ReactCrop
              crop={crop}
              onChange={c => setCrop(c)}
              onComplete={c => setCompletedCrop(c)}
            >
              <img 
                ref={imgRef}
                src={rawImageSrc} 
                onLoad={onImageLoad}
                style={{ maxHeight: '50vh', maxWidth: '100%', objectFit: 'contain' }}
                alt="Crop preview" 
              />
            </ReactCrop>
          </div>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '1rem' }}>
            Adjust the corners to crop your page, then press Next. Processing happens in the background!
          </p>
        </div>
      )}

      {/* --- ARRANGEMENT STATE --- */}
      {!rawImageSrc && pages.length > 0 && (
        <div className="scanner-arrangement-view">
          <div className="scanner-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h4 style={{ margin: 0, fontSize: '1.1rem' }}>Arrange Pages ({pages.length})</h4>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="button" className="auth-btn secondary" style={{ display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => handleCaptureClick(true)}><Camera size={14}/> Camera</button>
              <button type="button" className="auth-btn secondary" style={{ display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => handleCaptureClick(false)}><ImageIcon size={14}/> Image</button>
            </div>
          </div>

          {/* Global Filter Selector */}
          <div className="scanner-filters" style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', marginRight: '0.5rem' }}>Filter:</span>
            {FILTERS.map(f => (
              <button
                key={f}
                type="button"
                onClick={() => {
                  if (f !== globalFilter) {
                    alert('Warning: Applying a new high-quality filter to all images can take up to 10 minutes depending on your device. Please wait for the processing spinners to complete.');
                    setGlobalFilter(f);
                    setPages(prev => prev.map(p => ({ ...p, status: 'pending', imageSrc: p.rawImageSrc })));
                  }
                }}
                disabled={!cvLoaded}
                style={{
                  padding: '0.4rem 0.8rem',
                  borderRadius: '20px',
                  whiteSpace: 'nowrap',
                  fontSize: '0.9rem',
                  border: globalFilter === f ? '2px solid var(--primary)' : '1px solid var(--border)',
                  background: globalFilter === f ? 'rgba(139,92,246,0.1)' : 'var(--surface-hover)',
                  color: globalFilter === f ? 'var(--primary)' : 'var(--text-primary)',
                  cursor: 'pointer',
                  fontWeight: globalFilter === f ? 600 : 400,
                  transition: 'all 0.2s',
                  opacity: cvLoaded ? 1 : 0.5
                }}
              >
                {f}
              </button>
            ))}
          </div>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={pages.map(p => p.id)} strategy={rectSortingStrategy}>
              <div className="scanner-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem', background: 'var(--surface-hover)', padding: '1rem', borderRadius: '8px', minHeight: '200px' }}>
                {pages.map((page, i) => (
                  <SortableItem 
                    key={page.id} 
                    id={page.id} 
                    page={page} 
                    index={i} 
                    onRemove={removePage} 
                    onRotate={rotatePageArrangement} 
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <div className="scanner-footer" style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <button type="button" className="auth-btn primary" onClick={generatePDF} disabled={pages.some(p => p.status === 'pending')} style={{ padding: '0.75rem 2rem', fontSize: '1rem', display: 'inline-flex', alignItems: 'center', gap: '8px', opacity: pages.some(p => p.status === 'pending') ? 0.5 : 1 }}>
              {pages.some(p => p.status === 'pending') ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={18} />}
              {pages.some(p => p.status === 'pending') ? 'Processing...' : 'Done & Create PDF'}
            </button>
          </div>
        </div>
      )}

      {/* --- INITIAL STATE --- */}
      {!rawImageSrc && pages.length === 0 && (
        <div className="scanner-initial-view" style={{ textAlign: 'center', padding: '1rem 0' }}>
          <div style={{ background: 'var(--surface-hover)', padding: '2.5rem 1rem', borderRadius: '1rem', border: '1px dashed var(--border)' }}>
            <Camera size={44} color="var(--primary)" style={{ margin: '0 auto 1rem', opacity: 0.8 }} />
            <h3 style={{ marginBottom: '0.5rem', fontSize: '1.15rem' }}>Scan Notes</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              Use your camera to scan pages, or upload existing images.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <button type="button" className="auth-btn primary" onClick={() => handleCaptureClick(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Camera size={16} /> Open Camera
              </button>
              <button type="button" className="auth-btn secondary" onClick={() => handleCaptureClick(false)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ImageIcon size={16} /> Choose Images
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
