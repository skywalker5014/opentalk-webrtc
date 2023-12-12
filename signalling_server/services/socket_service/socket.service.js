import {WebSocketServer} from "ws";
import express, { urlencoded } from "express";
import cors from "cors";
import { v4 as uuidv4 } from 'uuid';
import userModel from "../../utilities/db_handler/user.js";

const app = express();

app.use(cors());
app.use(express.json());

const wss = new WebSocketServer({port: 3005}, console.log("socket service running"));






wss.on("connection", (ws) => {
ws.clientId = uuidv4();

ws.send(JSON.stringify({client: ws.clientId}))
	ws.on("error", console.error)
	ws.on("message",(m,isBinary) =>{ 
		
		wss.clients.forEach((client) => {
			// let data = JSON.parse(m)
			// let  = Object.values(data.message)
			// let clientOffer = null
			// let clientAnswer = null
			// let callerIce = []
			// let receiverIce = []
			// if(checker.includes()){
			// 	clientOffer = data.
			// }

			// console.log(m);
			if(JSON.parse(m).client !== client.clientId){
				client.send(m, {binary: isBinary})
			} 
		})

	});	
})

app.post('/call',(req,res) => {
	const data = req.body;
	wss.clients.forEach(client => {
		if(data.client !== client.clientId){
			client.send(JSON.stringify(data))
		}
		client.on("message", (m) => {
				const message = m.toString()
				if(message.includes('answer')){
					res.json(message)
				}
		})

	})
})

app.listen(3006)





