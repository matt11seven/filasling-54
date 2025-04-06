
import React from "react";

interface AudioPermissionBannerProps {
  audioPermissionGranted: boolean;
}

const AudioPermissionBanner = ({ audioPermissionGranted }: AudioPermissionBannerProps) => {
  // If audio permissions are granted, show a success message
  // If not granted, don't show any warning - just return null
  if (!audioPermissionGranted) {
    return null; // Return nothing when permissions aren't granted
  }
  
  return (
    <div className="p-4 rounded-md bg-green-50 dark:bg-green-950/30 mb-4">
      <p className="text-sm text-green-700 dark:text-green-400">
        ✓ Sons ativados! Você pode testar os diferentes sons abaixo.
      </p>
      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
        Os sons serão tocados para: novos atendimentos, alertas de atraso, entrada no pódio e primeiro lugar.
      </p>
    </div>
  );
};

export default AudioPermissionBanner;
