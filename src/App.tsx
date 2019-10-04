import React, { useEffect, useState } from "react";
import { load } from "@tensorflow-models/coco-ssd";
import * as posenet from "@tensorflow-models/posenet";

import "./App.css";

const App: React.FC = () => {
  const constraints = {
    audio: false,
    video: {
      facingMode: "user"
    }
  };
  const [predictions, setPredictions] = useState([
    {
      class: "nothing",
      score: 0
    }
  ]);

  useEffect(() => {
    getUserMedia();
  }, []);

  const videoWidth = 600;
  const videoHeight = 500;

  /**
   * Loads a the camera to be used in the demo
   *
   */
  async function setupCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error(
        "Browser API navigator.mediaDevices.getUserMedia not available"
      );
    }

    const video = document.querySelector("video")!;
    video.width = videoWidth;
    video.height = videoHeight;

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: "user"
      }
    });
    video.srcObject = stream;

    return new Promise(resolve => {
      video!.onloadedmetadata = () => {
        resolve(video);
      };
    });
  }

  async function getUserMedia() {
    let video = (await setupCamera()) as HTMLVideoElement;
    const model = await load({
      base: "lite_mobilenet_v2"
    });

    const net = await posenet.load({
      architecture: "ResNet50",
      outputStride: 32,
      inputResolution: 257,
      quantBytes: 2
    });

    setInterval(async () => {
      let canvas = document.querySelector("canvas")!.getContext("2d")!;
      document.querySelector("canvas")!.width = 700;
      document.querySelector("canvas")!.height = 800;
      canvas.strokeStyle = "#2fff00";
      canvas.lineWidth = 1;
      // @ts-ignore
      canvas.clearRect(0, 0, video.width, video.height);

      net
        .estimateMultiplePoses(video, {
          flipHorizontal: false
        })
        .then(poses => {
          poses.forEach(pose => {
            const boundingBox = posenet.getBoundingBox(pose.keypoints);

            canvas.rect(
              boundingBox.minX,
              boundingBox.minY,
              boundingBox.maxX - boundingBox.minX,
              boundingBox.maxY - boundingBox.minY
            );

            canvas.strokeStyle = "red";
            canvas.stroke();
            attemptToDrawPose(canvas, pose);
          });
        });
    }, 200);

    // Uncomment the line below for basic object detection
    // detectObjects(video, model, setPredictions);
  }

  function showPredictions() {
    return (
      <div>
        {predictions.map(prediction => {
          return (
            <li key={prediction.score}>
              {prediction.class} {Math.floor(100 * prediction.score)}%
            </li>
          );
        })}
      </div>
    );
  }

  return (
    <div className="App">
      <header className="App-header">
        <ul>{showPredictions()}</ul>
        <div>
          <canvas style={{ position: "absolute" }} />
          <video style={{ objectPosition: "top center" }} autoPlay />
        </div>
      </header>
    </div>
  );
};

export default App;
function attemptToDrawPose(
  canvas: CanvasRenderingContext2D,
  pose: posenet.Pose
) {
  if (pose.score > 0.6) {
    pose.keypoints.forEach(keypoint => {
      console.log("found pose");
      canvas.beginPath();
      canvas.arc(keypoint.position.x, keypoint.position.y, 4, 0, 2 * Math.PI);
      canvas.fillStyle = "red";
      canvas.fill();
    });
  }
}

function detectObjects(
  video: HTMLVideoElement,
  model: any,
  setPredictions: React.Dispatch<
    React.SetStateAction<{ class: string; score: number }[]>
  >
) {
  setInterval(async () => {
    let canvas = document.querySelector("canvas")!.getContext("2d")!;
    document.querySelector("canvas")!.width = 700;
    document.querySelector("canvas")!.height = 800;
    canvas.strokeStyle = "#2fff00";
    canvas.lineWidth = 1;
    canvas.clearRect(0, 0, video.width, video.height);
    // @ts-ignore
    model.detect(video).then(predictions => {
      setPredictions(predictions);
      // @ts-ignore
      predictions.forEach(prediction => {
        const x = prediction.bbox[0];
        const y = prediction.bbox[1];
        const width = prediction.bbox[2];
        const height = prediction.bbox[3];
        // Draw the bounding box.
        canvas.strokeStyle = "#2fff00";
        canvas.lineWidth = 1;
        canvas.strokeRect(x, y, width, height);
        // Draw the label background.
        canvas.fillStyle = "#2fff00";
        const textWidth = canvas.measureText(prediction.class).width;
        const textHeight = parseInt("24px helvetica", 10);
        // draw top left rectangle
        canvas.fillRect(x, y, textWidth + 10, textHeight + 10);
        // draw bottom left rectangle
        canvas.fillRect(
          x,
          y + height - textHeight,
          textWidth + 15,
          textHeight + 10
        );
        // Draw the text last to ensure it's on top.
        canvas.fillStyle = "#000000";
        canvas.fillText(prediction.class, x, y);
        canvas.fillText(
          prediction.score.toFixed(2),
          x,
          y + height - textHeight
        );
      });
    });
  }, 500);
}
