import { useState, useEffect, useRef } from "react";

const App = () => {
  const [clientid, setclientid] = useState(null);
  const [callreceived, setcallreceived] = useState(false);
  const [offer, setoffer] = useState(null);
  const [ice, setice] = useState([]);
  const ws = new WebSocket("ws://localhost:3005");
  const peer = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  });
  const candid = [];
  const can = useRef([]);

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

  async function createOffer() {
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
      }
    };
  }

  async function createAnswer() {
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
    ws.onmessage = async (message) => {
      let data = JSON.parse(message.data);
      if (Object.keys(data).includes("offerice")) {
        candid.push(data.offerice);
      }
    };
  }

  useEffect(() => {
    let id = null;

    ws.onmessage = async (message) => {
      let data = JSON.parse(message.data);
      if (Object.keys(data).length === 1 && clientid === null) {
        setclientid(data.client);
      } else if (Object.keys(data).length === 2) {
        if (Object.keys(data).includes("offer")) {
          setoffer(data.offer);
          setcallreceived(true);
        } else if (Object.keys(data).includes("offerice")) {
          setice((prev) => [...prev, data.offerice]);

          candid.push(data.offerice);
        } else if (Object.keys(data).includes("answerice")) {
          setice((prev) => [...prev, data.answerice]);
        }
      }
    };
  }, []);

  async function stream() {
    for (let candidates in ice) {
      await peer.addIceCandidate(candidates);
    }
    const remoteVideo = document.getElementById("remoteVideo");
    peer.addEventListener("track", async (event) => {
      const [remoteStream] = event.streams;
      remoteVideo.srcObject = remoteStream;
    });
  }

  return (
    <>
      <div>{clientid !== null ? clientid : "loading..."}</div>
      <div>
        localstream: <br />
        <video
          id="localVideo"
          autoPlay
          playsInline
          style={{ width: "200px" }}
        ></video>{" "}
        <br />
        remotestream: <br />
        <video
          id="remoteVideo"
          autoPlay
          playsInline
          style={{ width: "200px" }}
        ></video>
      </div>
      <button onClick={() => media()}>media setup</button>
      <button onClick={() => createOffer()}>call</button>
      <button onClick={() => createAnswer()}>answer call</button>
      <button onClick={() => stream()}>start stream</button>
      <br />
      <br />
      <h1 style={{ color: "red" }}>{callreceived ? "answer call" : ""}</h1>
    </>
  );
};

export default App;
