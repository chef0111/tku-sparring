import * as React from 'react';

export function getNavigatorOnLine() {
  if (typeof navigator === 'undefined') {
    return true;
  }
  return navigator.onLine;
}

export function useOnlineStatus() {
  const [online, setOnline] = React.useState(getNavigatorOnLine);

  React.useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);

    window.addEventListener('online', on);
    window.addEventListener('offline', off);

    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  return online;
}
