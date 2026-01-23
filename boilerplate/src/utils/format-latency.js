// Helper to present latency values in a readable unit.
// Converts seconds to minutes when >= 60 seconds.
export const formatLatency = (valueSeconds) => {
  const seconds = Number(valueSeconds) || 0;
  const useMinutes = seconds >= 60;

  if (useMinutes) {
    const minutes = seconds / 60;
    return {
      display: `${minutes.toFixed(minutes >= 10 ? 1 : 2)}m`,
      seconds,
    };
  }

  return {
    display: `${seconds.toFixed(seconds >= 10 ? 1 : 2)}s`,
    seconds,
  };
};

