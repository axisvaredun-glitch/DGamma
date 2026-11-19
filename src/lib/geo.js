/**
 * Browser Geolocation helpers.
 * High-accuracy lock with clear permission / timeout outcomes.
 */

export function readGpsPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(Object.assign(new Error('Geolocation unsupported'), { code: 'unsupported' }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        const code =
          error.code === error.PERMISSION_DENIED
            ? 'denied'
            : error.code === error.POSITION_UNAVAILABLE
              ? 'unavailable'
              : error.code === error.TIMEOUT
                ? 'timeout'
                : 'error';
        reject(Object.assign(new Error(error.message || 'GPS failed'), { code }));
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      },
    );
  });
}

export function gpsStatusText(code) {
  return (
    {
      locating: 'Locating…',
      ready: 'GPS · Kecamatan',
      denied: 'GPS denied',
      unavailable: 'GPS unavailable',
      timeout: 'GPS timeout',
      unsupported: 'GPS unsupported',
      error: 'GPS error',
      demo: 'Demo · GPS approx',
      saved: 'Saved location',
    }[code] || code
  );
}
