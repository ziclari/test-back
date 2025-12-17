// VideoModal.jsx
import { motion, AnimatePresence } from "framer-motion";
import { getPath } from "../../config-parser/getPath";
import { stateManager } from "../../managers/stateManager";
import { UIController } from "../../render/UIController";

export default function VideoModal({ videoData}) {
  if (!videoData) return null;
  console.log(videoData)
  const videoId = videoData.id;
  const isDriveVideo = videoData.src.includes("drive.google.com");


  const onClose = () => {
    UIController.execute(`end:${videoId}`);
    stateManager.set("videoId", null);
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="relative w-[90%] max-w-7xl aspect-video bg-black">
          {isDriveVideo ? (
            <iframe 
              src={videoData.src} 
              allow="autoplay"
              className="w-full h-full rounded-lg"
            ></iframe>
          ) : (
            <video 
              src={getPath(videoData.src)} 
              controls 
              autoPlay
              className="w-full h-full rounded-lg" />
          )}

          <button 
            onClick={onClose}   
            className="absolute cursor-pointer -top-4 -right-4 text-white bg-black px-4 py-3 rounded-full"
          >✕</button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
