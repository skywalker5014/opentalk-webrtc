import {useState, useEffect} from 'react';

const App = () => {
    const [clientId, setclientid] = useState(null)

    function init(){
        console.log('process started');
    }

    function call(){
        console.log('calling process started');
    }

    const configuration = {
        iceServers: [
          {
            urls: [
              "stun:stun1.1.google.com:19302",
              "stun:stun2.1.google.com:19302",
            ],
          },
        ],
        iceCandidatePoolSize: 10,
      };

      let wss = null
      let lp = null

      useEffect(() => {
        wss = new WebSocket("ws://localhost:3005");
        lp = new RTCPeerConnection(configuration);

        wss.onmessage = async (m) => {

            if(Object.keys(JSON.parse(m.data)).length === 1 && clientId === null){
                setclientid(JSON.parse(m.data).clientid)
                console.log('client id set');
            } 

            else if(Object.keys(JSON.parse(m.data)).length === 2 && JSON.parse(m.data).client !== clientId){
                if(JSON.parse(m.data).sdp.type === 'offer'){
                    console.log('offer received');
                    await lp.setRemoteDescription(new RTCSessionDescription(JSON.parse(m.data).sdp));
                    console.log('offer set as remote');
                    const createans = async () => await lp.createAnswer()
                    createans()
                    .then(async (answer) => await lp.setLocalDescription(new RTCSessionDescription(answer)))
                    .then(() => {
                        if(clientId !== null){
                            wss.send(JSON.stringify({client: clientId , sdp: lp.localDescription}))
                            console.log('sent answer');
                        }
                    }).then(() => {
                        lp.onicecandidate((event) => {
                            if(event.candidate){
                                wss.send(JSON.stringify({client: clientId, ice: event.candidate}))
                                console.log('sent ice candidate');
                            }
                        })
                    })
                } 

                else if(JSON.parse(m.data).ice){
                   await lp.addIceCandidate(JSON.parse(m.data).ice)
                   console.log('received ice candidate');
                }

                else if(JSON.parse(m.data).sdp.type === 'answer'){
                    await lp.setRemoteDescription(new RTCSessionDescription(JSON.parse(m.data).sdp))
                    console.log('received answer');
                }

            }
        }
      },[init])

      useEffect(() => {
        const localmedia = document.getElementById('localvideo');
        const media = async () => await navigator.mediaDevices.getUserMedia({video: true, audio: true})
        const ofr = async () => await lp.createOffer();

        media()
        .then((media) => {
            localmedia.srcObject = media;
            media.getTracks().forEach(track => {
                lp.addTrack(track,localmedia)
            })
        })

        ofr()
        .then(async (offer) =>{
        await lp.setLocalDescription(new RTCSessionDescription(offer)) 
        })
        .then(() => {
            wss.send(JSON.stringify({client: clientId, sdp: lp.localDescription}))
            console.log('sent offer');
        }).then(() => {
            lp.onicecandidate((event) => {
                if(event.candidate){
                    wss.send(JSON.stringify({client: clientId, ice: event.candidate}))
                    console.log('sent ice candidate');
                }
            })
        }) 

      }, [call])


      return(
        <>
        <div>
          <video
            id="localvideo"
            style={{ width: "500px" }}
            autoPlay
            playsInline
          ></video>
          <video id="remotevideo" autoPlay playsInline></video>
        </div>
        <div>
          <button onClick={() => init()}>setup you media</button>
          <button onClick={() => call()}>call</button>
          <button className="incoming">
            answer call
          </button>
          <button>
            end call
          </button>
        </div>
      </>  
      )

}

export default App;


// import { useState, useEffect } from "react";

// const App = () => {
//   const [clientId, setclientid] = useState(null);
//   const [ttt, setttt] = useState(null)

//   const configuration = {
//     iceServers: [
//       {
//         urls: [
//           "stun:stun1.1.google.com:19302",
//           "stun:stun2.1.google.com:19302",
//         ],
//       },
//     ],
//     iceCandidatePoolSize: 10,
//   };

//   const localPeer = new RTCPeerConnection(configuration);
//   const remotePeer = new RTCPeerConnection(configuration);

//   async function mediasetup() {
//     const local = document.getElementById("localvideo");
//     const media = async () => await navigator.mediaDevices.getUserMedia({video: true, audio: true})
//     media().then((av) =>{ 
//       local.srcObject = av
//       av.getTracks().forEach(track => {
//         localPeer.addTrack(track, local)
//       })
//     })
//   }



//   const wss = new WebSocket("ws://localhost:3005");

//   wss.onopen = async (r) => {
//     console.log('conneciton is open');
//     console.log(localPeer.iceGatheringState); 
//     console.log(localPeer.signalingState);
//     localPeer.addEventListener("icecandidate", event => {
//       console.log(event);
//       if(event.candidate){
//         console.log(event.candidate);
//         wss.send(JSON.stringify({'new-ice-candidate' : event.candidate}))
//       }
//     })
//   }

//   async function call() {
//     const ofr = async () => await localPeer.createOffer();
//     ofr().then(async (e) => await localPeer.setLocalDescription(new RTCSessionDescription(e)))
//     .then(() => {
//       // console.log(webrtc.localDescription);
//       console.log('Connection state during call process:', localPeer.connectionState);
//       wss.send(JSON.stringify({client: clientId , sdp: localPeer.localDescription}))
//       console.log('Connection state after offer sent:', localPeer.connectionState);
//   }).then(() => 
//     console.log(localPeer.signalingState)
//   )
//   }


//   // useEffect(() => {
//   //   setttt(clientId);
//   // }, [clientId]);

//   useEffect(() => 
//   wss.onmessage = async (m) =>  {
//   // console.log(Object.keys(JSON.parse(m.data)).length)
//     if(Object.keys(JSON.parse(m.data)).length === 1 && clientId === null){  
//       setclientid(JSON.parse(m.data).clientid);

//       // console.log(JSON.parse(m.data).clientid);
//       console.log('Connection state during server connection first message:', localPeer.connectionState);
//     } else if(Object.keys(JSON.parse(m.data)).length === 2){
//       if(JSON.parse(m.data).sdp.type === 'offer' && JSON.parse(m.data).client !== clientId){
//         // console.log("parsed: " + (JSON.parse(m.data).client));
//         console.log('Connection state when received offer:', localPeer.connectionState);
//         await remotePeer.setRemoteDescription(new RTCSessionDescription(JSON.parse(m.data).sdp));
//         console.log('Connection state after setting offer as remote description:', localPeer.connectionState);
//         console.log(localPeer.signalingState);
//         const ans = async () => await remotePeer.createAnswer();
//         ans().then(async (a) => {
//           console.log('Connection state before sending answer:', localPeer.connectionState);
//           await remotePeer.setLocalDescription(a);
//           console.log('Connection state after setting answer as local deacriptioin:', localPeer.connectionState);
//           console.log(localPeer.signalingState);
//           const id = clientId;
//           if(clientId !== null){
//           alert('getting call from: '+ JSON.parse(m.data).client)
//           console.log('Connection state:', localPeer.connectionState);
//           wss.send(JSON.stringify({client: id , sdp: a}));

//         }
//         })

//       } else if(JSON.parse(m.data).sdp.type === 'answer' && JSON.parse(m.data).client !== clientId){
//         // console.log(JSON.parse(m.data));
//         try {
//           console.log('Connection state when received answer:', localPeer.connectionState);
//           console.log(localPeer.signalingState);
//           await localPeer.setRemoteDescription(new RTCSessionDescription(JSON.parse(m.data).sdp));
//           console.log('Connection state after setting answer as remote:', localPeer.connectionState);
//           console.log(localPeer.signalingState);
//           console.log('remote set');
//         } catch (error) {
//           console.log(error);
//         }

//       }
//     } 
// }
// ,[clientId])




//   return (
//     <>
//       <div>
//         <video
//           id="localvideo"
//           style={{ width: "500px" }}
//           autoPlay
//           playsInline
//         ></video>
//         <video id="remotevideo" autoPlay playsInline></video>
//       </div>
//       <div>
//         <button onClick={() => mediasetup()}>setup you media</button>
//         <button onClick={() => call()}>call</button>
//         <button className="incoming" onClick={() => answercall()}>
//           answer call
//         </button>
//         <button>
//           end call
//         </button>
//       </div>
//     </>
//   );
// };

// export default App;
