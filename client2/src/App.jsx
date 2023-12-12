import { useState, useEffect} from "react";

function App() {
  const [clientid, setclientid] = useState(null);
  const [offer, setoffer] = useState(null);
  const candidates = [];
  const [icestoreatreceiver, seticestoreatreceiver] = useState([]);

  const peer = new RTCPeerConnection({
    iceServers: [
      {
        urls: [
          "stun:stun.l.google.com:19302",
          "stun:global.stun.twilio.com:3478",
        ],
      },
    ],
  });
  const ws = new WebSocket("ws://localhost:3005");

  async function media() {
    const localVideo = document.getElementById("localVideo");
    const init = async () =>
      await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    init().then((media) => {
      localVideo.srcObject = media;
      media.getTracks().forEach((track) => {
        peer.addTrack(track, media);
      });
    });
  }

  useEffect(() => {
    ws.onmessage = async (message) => {
      let data = JSON.parse(message.data);
      if (Object.keys(data).length === 1 && clientid === null) {
        setclientid(data.client);
      } else if (Object.keys(data).length === 2) {
        if (Object.keys(data).includes("offer")) {
          setoffer(data.offer);
        } else if (Object.keys(data).includes("offerice")) {
          candidates.push(data.offerice);
          seticestoreatreceiver((prevdata) => [...prevdata, data.offerice]);
        }
      }
    };

    peer.ontrack = (e) => {
      console.log("got tracks");
      document.getElementById("remoteVideo").srcObject = e.streams[0];
    };
  }, []);

  async function call() {
    const offer = await peer.createOffer();
    await peer.setLocalDescription(new RTCSessionDescription(offer));
    ws.send(JSON.stringify({ client: clientid, offer: peer.localDescription }));
    peer.onicecandidate = (event) => {
      if (event.candidate) {
        ws.send(
          JSON.stringify({ client: clientid, offerice: event.candidate })
        );
      }
    };
    ws.onmessage = async (message) => {
      let data = JSON.parse(message.data);
      if (Object.keys(data).includes("answer")) {
        await peer.setRemoteDescription(new RTCSessionDescription(data.answer));
      } else if (Object.keys(data).includes("answerice")) {
        candidates.push(data.answerice);
      }
    };
  }

  async function answer() {
    await peer.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(new RTCSessionDescription(answer));
    ws.send(
      JSON.stringify({ client: clientid, answer: peer.localDescription })
    );
    peer.onicecandidate = (event) => {
      if (event.candidate) {
        ws.send(
          JSON.stringify({ client: clientid, answerice: event.candidate })
        );
      }
    };
  }

  async function start() {
    if (candidates.length === 0) {
      for (let item of icestoreatreceiver) {
        await peer.addIceCandidate(new RTCIceCandidate(item));
      }
    } else {
      for (let candidate of candidates) {
        await peer.addIceCandidate(new RTCIceCandidate(candidate));
      }
    }
  }

  return (
    <>
      <h3>{clientid !== null ? clientid : "locading..."}</h3>
      <div style={{ display: "flex", gap: "50px" }}>
        <div>
          localVideo:: <br />
          <br />
          <video
            id="localVideo"
            autoPlay
            playsInline
            style={{ width: "300px" }}
          ></video>
        </div>
        <div>
          remoteVideo:: <br />
          <br />
          <video
            id="remoteVideo"
            autoPlay
            playsInline
            style={{ width: "300px" }}
          ></video>
        </div>
      </div>

      <br />
      <br />
      <div>
        <button onClick={() => media()}>media</button>
        <button onClick={() => call()}>call</button>
        <button onClick={() => start()}>stream</button>
      </div>
      {offer !== null ? (
        <button onClick={() => answer()} style={{ backgroundColor: "green" }}>
          answer
        </button>
      ) : (
        <></>
      )}
    </>
  );
}

export default App;
