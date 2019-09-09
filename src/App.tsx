import React, { useEffect, useState } from "react";
import { load } from "@tensorflow-models/coco-ssd";
import "./App.css";

const App: React.FC = () => {
  const constraints = { video: true };
  const [predictions, setPredictions] = useState([
    {
      class: "nothing",
      score: 0
    }
  ]);

  useEffect(() => {
    getUserMedia();
  }, []);

  async function getUserMedia() {
    const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
    let video = document.querySelector("video")!;
    video.srcObject = mediaStream;
    video.onloadedmetadata = function(e) {
      video.play();
    };
    const model = await load({
      base: "mobilenet_v2"
    });

    video.addEventListener("loadeddata", event => {});

    setInterval(() => {
      model.detect(video).then(predictions => {
        let canvas = document.querySelector("canvas")!.getContext("2d")!;
        document.querySelector("canvas")!.width = 700;
        document.querySelector("canvas")!.height = 800;

        canvas.strokeStyle = "#2fff00";
        canvas.lineWidth = 1;
        canvas.clearRect(0, 0, video.width, video.height);
        setPredictions(predictions);

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
        console.log("Predictions: ", predictions);
      });
    }, 500);
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
