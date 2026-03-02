document.body.addEventListener('click', async () => {
    try {
        // This triggers the official Chrome permission popup
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        console.log("Microphone permission officially granted!");
        
        // Stop the tracks immediately, we just needed to trigger the permission state
        stream.getTracks().forEach(track => track.stop());
        
    } catch (err) {
        console.error("Permission denied:", err);
    }
});