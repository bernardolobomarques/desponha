import React, { useRef, useEffect, useState } from 'react';
import { Spinner } from './ui/Spinner';

interface CameraCaptureProps {
    onCapture: (file: File) => void;
    onClose: () => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let stream: MediaStream;

        const startCamera = async () => {
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment' } 
                });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.onloadedmetadata = () => {
                        setIsLoading(false);
                    };
                }
            } catch (err) {
                console.error("Error accessing camera:", err);
                setError("Não foi possível acessar a câmera. Verifique as permissões do seu navegador.");
                setIsLoading(false);
            }
        };

        startCamera();

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            if(context) {
                context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
                canvas.toBlob((blob) => {
                    if (blob) {
                        const file = new File([blob], `receipt-${Date.now()}.jpg`, { type: 'image/jpeg' });
                        onCapture(file);
                    }
                }, 'image/jpeg', 0.9);
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex flex-col justify-center items-center p-4 animate-fade-in-up" role="dialog" aria-modal="true">
            <div className="relative w-full max-w-2xl bg-slate-800 rounded-lg shadow-xl overflow-hidden">
                <video ref={videoRef} autoPlay playsInline className={`w-full h-auto ${isLoading ? 'hidden' : 'block'}`}></video>
                <canvas ref={canvasRef} className="hidden"></canvas>
                
                {isLoading && (
                    <div className="aspect-video w-full flex flex-col justify-center items-center text-white">
                        {error ? <p className="text-red-400 p-4 text-center">{error}</p> : <><Spinner /> <p className="mt-2">Iniciando câmera...</p></>}
                    </div>
                )}

                {!error && (
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent flex justify-center">
                        <button onClick={handleCapture} className="h-16 w-16 bg-white rounded-full border-4 border-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-white" aria-label="Tirar Foto"></button>
                    </div>
                )}
                
                <button onClick={onClose} className="absolute top-2 right-2 h-10 w-10 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70" aria-label="Fechar Câmera">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
        </div>
    );
};
