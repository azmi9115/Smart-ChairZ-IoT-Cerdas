const FIREBASE_URL = "https://tugas-akhir-b14ec-default-rtdb.asia-southeast1.firebasedatabase.app";
const FIREBASE_SECRET = "WfqNthbD3Shiu13yZhJLpwJ7lJq5jRci5txbHsX3";

export const logPostureHistory = async (timestamp: string, payload: any) => {
  try {
    const url = `${FIREBASE_URL}/SmartChairz/PosturHistory/${timestamp}.json?auth=${FIREBASE_SECRET}`;
    
    await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    console.error("Error logging to Firebase:", error);
  }
};

export const getPostureHistory = async () => {
    try {
        const url = `${FIREBASE_URL}/SmartChairz/PosturHistory.json?auth=${FIREBASE_SECRET}`;
        const response = await fetch(url, {
            headers: { 'Cache-Control': 'no-cache' }
        });
        const data = await response.json();
        return data; // returns an object mapping timestamp -> payload
    } catch (error) {
        console.error("Error fetching Firebase history:", error);
        return null;
    }
}

export const clearHistoryData = async () => {
    try {
        const url = `${FIREBASE_URL}/SmartChairz/PosturHistory.json?auth=${FIREBASE_SECRET}`;
        await fetch(url, {
            method: 'DELETE',
        });
    } catch (error) {
        console.error("Error clearing Firebase history:", error);
    }
}
