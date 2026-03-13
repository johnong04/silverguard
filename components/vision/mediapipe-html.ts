/**
 * MediaPipe Pose Landmarker HTML for WebView
 *
 * This HTML string runs inside a WebView and handles:
 * - Camera access via getUserMedia()
 * - MediaPipe Pose Landmarker v0.10.21 from CDN
 * - Canvas overlay drawing 33 pose landmarks as jade-colored skeleton
 * - Fall detection algorithm
 * - React Native bridge communication via postMessage
 *
 * IMPORTANT: On Android, WebView doesn't support getUserMedia for local HTML.
 * You need to host this HTML on a real HTTPS server for camera access to work.
 * Set MEDIAPIPE_HOSTED_URL to your hosted URL.
 */

/**
 * URL to hosted MediaPipe HTML file.
 *
 * To enable camera on Android:
 * 1. Create a new file on Vercel/Netlify/GitHub Pages
 * 2. Copy the HTML content below (without the backticks)
 * 3. Set this URL to your hosted file
 *
 * Example: 'https://your-domain.vercel.app/mediapipe-pose.html'
 */
export const MEDIAPIPE_HOSTED_URL: string | null =
  "https://umsic-blond.vercel.app/mediapipe-pose.html";

export const MEDIAPIPE_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <meta http-equiv="Content-Security-Policy" content="default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; media-src *;">
  <title>SilverGuard Vision Engine</title>
  <!-- ElevenLabs SDK for Voice AI -->
  <script src="https://elevenlabs.io/convai-sdk/v1/sdk.js"></script>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    html, body {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: #09090B;
    }
    
    #container {
      position: relative;
      width: 100%;
      height: 100%;
    }
    
    #video {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      transform: scaleX(-1); /* Mirror for selfie view */
    }
    
    #canvas {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      transform: scaleX(-1); /* Mirror to match video */
    }
    
    #status {
      position: absolute;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      padding: 8px 16px;
      background: rgba(0, 0, 0, 0.6);
      color: #10B981;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 12px;
      border-radius: 20px;
      z-index: 100;
    }
    
    #error {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      padding: 24px;
      background: rgba(28, 25, 23, 0.95);
      border: 1px solid rgba(220, 38, 38, 0.5);
      color: white;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      border-radius: 16px;
      text-align: center;
      max-width: 85%;
      display: none;
      z-index: 200;
    }
    
    #error h3 {
      color: #DC2626;
      margin-bottom: 12px;
      font-size: 18px;
    }
    
    #error p {
      color: #A8A29E;
      line-height: 1.5;
      margin-bottom: 8px;
    }
    
    #error .hint {
      font-size: 12px;
      color: #78716C;
      margin-top: 16px;
      padding-top: 12px;
      border-top: 1px solid rgba(255,255,255,0.1);
    }
  </style>
</head>
<body>
  <div id="container">
    <video id="video" autoplay playsinline muted></video>
    <canvas id="canvas"></canvas>
    <div id="status">Initializing Vision Engine...</div>
    <div id="error"></div>
  </div>

  <script type="module">
    // DOM Elements
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const statusEl = document.getElementById('status');
    const errorEl = document.getElementById('error');

    // Colors matching the Warm Ember theme
    const JADE_GREEN = '#10B981';
    const JADE_GREEN_LIGHT = 'rgba(16, 185, 129, 0.6)';
    const AMBER = '#F59E0B';

    // ElevenLabs State
    let conversation = null;
    const ELEVEN_API_KEY = "sk_77664683afdb3ee4c6555b7062356be01bb3f6d577ac8711"; // MANUAL TASK: Replace this
    const ELEVEN_AGENT_ID = "agent_7801kcz0tvx2fxavd3wbgrzm0smn";

    // Fall detection state
    let previousCentroid = null;
    let previousTime = null;
    let fallCooldown = false;
    const FALL_COOLDOWN_MS = 5000;

    // MediaPipe instance
    let poseLandmarker = null;
    let lastDetectionTime = 0;
    const DETECTION_INTERVAL_MS = 100;

    // Skeleton connections for drawing
    const POSE_CONNECTIONS = [
      [11, 12], [11, 23], [12, 24], [23, 24],
      [11, 13], [13, 15], [12, 14], [14, 16],
      [23, 25], [25, 27], [24, 26], [26, 28],
      [0, 1], [1, 2], [2, 3], [3, 7],
      [0, 4], [4, 5], [5, 6], [6, 8],
      [9, 10], [11, 12]
    ];

    function showError(title, message, hint = '') {
      errorEl.innerHTML = \`
        <h3>\${title}</h3>
        <p>\${message}</p>
        \${hint ? '<p class="hint">' + hint + '</p>' : ''}
      \`;
      errorEl.style.display = 'block';
      statusEl.style.display = 'none';
      sendToReactNative('ERROR', { message: title + ': ' + message });
    }

    function updateStatus(message) {
      statusEl.textContent = message;
    }

    function sendToReactNative(type, data = {}) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type, ...data }));
      } else {
        console.log('RN Bridge:', type, data);
      }
    }

    async function startVoiceAI() {
      if (conversation) return;
      
      try {
        updateStatus('🎙️ Connecting to Auntie...');
        conversation = await window.ElevenLabs.Conversation.startSession({
          apiKey: ELEVEN_API_KEY,
          agentId: ELEVEN_AGENT_ID,
          onConnect: () => {
            updateStatus('🎙️ Voice Active');
            sendToReactNative('VOICE_START');
          },
          onDisconnect: () => {
            updateStatus('Guard Mode Active');
            conversation = null;
            sendToReactNative('VOICE_END');
          },
          onMessage: (msg) => {
            if (msg.source === 'ai' || msg.source === 'user') {
              sendToReactNative('TRANSCRIPTION', { text: msg.message });
            }
          },
          onError: (err) => {
            console.error('Voice AI Error:', err);
            updateStatus('Voice AI Error');
          }
        });
      } catch (err) {
        console.error('Failed to start ElevenLabs:', err);
        updateStatus('Voice AI Failed');
      }
    }

    function stopVoiceAI() {
      if (conversation) {
        conversation.endSession();
        conversation = null;
      }
    }

    // Listen for messages from React Native
    window.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'START_VOICE') {
          startVoiceAI();
        } else if (data.type === 'STOP_VOICE') {
          stopVoiceAI();
        }
      } catch (err) {
        console.error('Failed to parse RN message:', err);
      }
    });

    function average(...points) {
      const validPoints = points.filter(p => p && p.visibility > 0.5);
      if (validPoints.length === 0) return null;
      
      return {
        x: validPoints.reduce((sum, p) => sum + p.x, 0) / validPoints.length,
        y: validPoints.reduce((sum, p) => sum + p.y, 0) / validPoints.length,
        visibility: validPoints.reduce((sum, p) => sum + p.visibility, 0) / validPoints.length
      };
    }

    function checkFall(landmarks) {
      if (fallCooldown) return;
      
      const leftShoulder = landmarks[11];
      const rightShoulder = landmarks[12];
      const leftHip = landmarks[23];
      const rightHip = landmarks[24];
      const nose = landmarks[0];
      const leftAnkle = landmarks[27];
      const rightAnkle = landmarks[28];

      const shoulders = average(leftShoulder, rightShoulder);
      const hips = average(leftHip, rightHip);
      const ankles = average(leftAnkle, rightAnkle);
      
      if (!shoulders || !hips || !nose || !ankles) return;

      const centroid = average(shoulders, hips);
      if (!centroid) return;

      const now = Date.now();

      if (nose.y > ankles.y + 0.1 && nose.visibility > 0.7 && ankles.visibility > 0.5) {
        triggerFall('nose_below_ankles');
        return;
      }

      if (previousCentroid && previousTime) {
        const deltaY = centroid.y - previousCentroid.y;
        const deltaTime = now - previousTime;

        if (deltaY > 0.30 && deltaTime < 400 && deltaTime > 50) {
          triggerFall('rapid_drop');
          return;
        }
      }

      previousCentroid = { ...centroid };
      previousTime = now;
    }

    function triggerFall(reason) {
      if (fallCooldown) return;
      
      fallCooldown = true;
      updateStatus('⚠️ FALL DETECTED');
      
      sendToReactNative('FALL_DETECTED', { 
        reason,
        timestamp: Date.now(),
        confidence: 0.95
      });

      // Automatically start Voice AI on fall detection
      startVoiceAI();

      setTimeout(() => {
        fallCooldown = false;
        if (!conversation) {
          updateStatus('Guard Mode Active');
        }
      }, FALL_COOLDOWN_MS);
    }

    function drawSkeleton(landmarks) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!landmarks || landmarks.length === 0) return;

      ctx.strokeStyle = JADE_GREEN;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';

      for (const [startIdx, endIdx] of POSE_CONNECTIONS) {
        const start = landmarks[startIdx];
        const end = landmarks[endIdx];

        if (start && end && start.visibility > 0.5 && end.visibility > 0.5) {
          ctx.beginPath();
          ctx.moveTo(start.x * canvas.width, start.y * canvas.height);
          ctx.lineTo(end.x * canvas.width, end.y * canvas.height);
          ctx.stroke();
        }
      }

      for (let i = 0; i < landmarks.length; i++) {
        const landmark = landmarks[i];
        if (landmark && landmark.visibility > 0.5) {
          const x = landmark.x * canvas.width;
          const y = landmark.y * canvas.height;

          ctx.beginPath();
          ctx.arc(x, y, 8, 0, 2 * Math.PI);
          ctx.fillStyle = JADE_GREEN_LIGHT;
          ctx.fill();

          ctx.beginPath();
          ctx.arc(x, y, 4, 0, 2 * Math.PI);
          ctx.fillStyle = JADE_GREEN;
          ctx.fill();
        }
      }
    }

    async function detectPose(timestamp) {
      if (!poseLandmarker || !video.videoWidth) {
        requestAnimationFrame(detectPose);
        return;
      }

      if (timestamp - lastDetectionTime < DETECTION_INTERVAL_MS) {
        requestAnimationFrame(detectPose);
        return;
      }
      lastDetectionTime = timestamp;

      try {
        const results = poseLandmarker.detectForVideo(video, timestamp);

        if (results.landmarks && results.landmarks.length > 0) {
          const landmarks = results.landmarks[0];
          drawSkeleton(landmarks);
          checkFall(landmarks);
          
          if (!fallCooldown) {
            updateStatus('Guard Mode Active');
          }
        } else {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          updateStatus('Searching for person...');
        }
      } catch (err) {
        console.error('Detection error:', err);
      }

      requestAnimationFrame(detectPose);
    }

    // Check for camera API availability
    function checkCameraSupport() {
      // Check if we're in a secure context
      if (typeof window.isSecureContext !== 'undefined' && !window.isSecureContext) {
        return { 
          supported: false, 
          reason: 'insecure_context',
          message: 'Camera access requires a secure connection (HTTPS).'
        };
      }

      // Check for mediaDevices API
      if (!navigator.mediaDevices) {
        return { 
          supported: false, 
          reason: 'no_media_devices',
          message: 'Your browser does not support camera access.'
        };
      }

      // Check for getUserMedia
      if (!navigator.mediaDevices.getUserMedia) {
        return { 
          supported: false, 
          reason: 'no_get_user_media',
          message: 'Camera API (getUserMedia) is not available.'
        };
      }

      return { supported: true };
    }

    async function initCamera() {
      updateStatus('Checking camera support...');
      
      const support = checkCameraSupport();
      if (!support.supported) {
        throw new Error('Camera access denied: ' + support.message);
      }

      try {
        updateStatus('Requesting camera access...');
        
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 480 }
          },
          audio: false // Disabled here to avoid Camera conflict; ElevenLabs SDK will request Mic when session starts
        });

        video.srcObject = stream;
        
        return new Promise((resolve, reject) => {
          video.onloadedmetadata = () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            resolve();
          };
          video.onerror = () => reject(new Error('Failed to load video stream'));
        });
      } catch (err) {
        if (err.name === 'NotAllowedError') {
          throw new Error('Camera permission was denied. Please allow camera access.');
        } else if (err.name === 'NotFoundError') {
          throw new Error('No camera found on this device.');
        } else if (err.name === 'NotReadableError') {
          throw new Error('Camera is in use by another application.');
        }
        throw new Error('Camera access denied: ' + err.message);
      }
    }

    async function initMediaPipe() {
      try {
        updateStatus('Loading AI model...');
        
        const { PoseLandmarker, FilesetResolver } = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21');
        
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm'
        );

        poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
            delegate: 'GPU'
          },
          runningMode: 'VIDEO',
          numPoses: 1,
          minPoseDetectionConfidence: 0.5,
          minPosePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        updateStatus('Vision Engine ready');
        sendToReactNative('READY');
      } catch (err) {
        throw new Error('Failed to load AI model: ' + err.message);
      }
    }

    async function init() {
      try {
        await initCamera();
        await initMediaPipe();
        requestAnimationFrame(detectPose);
      } catch (err) {
        const isSecureContext = window.isSecureContext;
        const hint = !isSecureContext 
          ? 'WebView camera access requires special configuration. The app is working on enabling this feature.'
          : 'Make sure you have granted camera permissions to the app.';
        
        showError(
          'Vision Engine Error',
          err.message,
          hint
        );
      }
    }

    // Start initialization
    init();

    // Handle visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        updateStatus('Paused');
      } else {
        updateStatus('Resuming...');
      }
    });
  </script>
</body>
</html>
`;
